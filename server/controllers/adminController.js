// controllers/adminController.js
import Withdrawal from "../models/Withdrawal.js";
import User from "../models/User.js";
import Release from "../models/Release.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "./releaseController.js";
import {
  sendReleaseApprovalEmail,
  sendReleaseRejectionEmail,
} from "../utils/emailService.js";
import { logAdminAction } from "../middleware/authMiddleware.js";
import AuditLog from "../models/AuditLog.js";

import dotenv from "dotenv";
dotenv.config();

// @desc    Get all pending withdrawals
// @route   GET /api/admin/withdrawals
// @access  Private/Admin
export const getPendingWithdrawals = async (req, res) => {
  try {
    // Populate pulls in the Artist's name and email so you know who you are paying
    const pendingRequests = await Withdrawal.find({ status: "pending" })
      .populate("artistId", "legalName stageName email")
      .sort({ createdAt: 1 }); // Oldest first

    res.status(200).json(pendingRequests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending withdrawals" });
  }
};

// @desc    Approve or Reject a withdrawal
// @route   PUT /api/admin/withdrawals/:id
// @access  Private/Admin
export const processWithdrawal = async (req, res) => {
  const { action, notes } = req.body; // action = 'approve' or 'reject'
  const withdrawalId = req.params.id;

  try {
    const withdrawal = await Withdrawal.findById(withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    if (withdrawal.status !== "pending") {
      return res
        .status(400)
        .json({ message: "This request has already been processed." });
    }

    if (action === "approve") {
      // You have already manually sent the money via Paystack/Bank Transfer
      withdrawal.status = "approved";
      withdrawal.adminNotes = notes || "Processed successfully.";
      await withdrawal.save();

      return res
        .status(200)
        .json({ message: "Withdrawal marked as approved." });
    }

    if (action === "reject") {
      // If rejected (e.g., fraud detected, or invalid bank details), we must refund the user's wallet
      const user = await User.findById(withdrawal.artistId);

      if (withdrawal.currency === "USD")
        user.walletBalanceUSD += withdrawal.amount;
      if (withdrawal.currency === "NGN")
        user.walletBalanceNGN += withdrawal.amount;
      await user.save();

      withdrawal.status = "rejected";
      withdrawal.adminNotes =
        notes || "Rejected by Admin. Funds refunded to wallet.";
      await withdrawal.save();

      return res
        .status(200)
        .json({ message: "Withdrawal rejected and funds refunded." });
    }
  } catch (error) {
    res.status(500).json({ message: "Error processing the withdrawal" });
  }
};

// @desc    Get all users for the platform
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    // Fetch users and exclude passwords for security
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

// @desc    Manually override and verify a user
// @route   PUT /api/admin/users/:id/verify
// @access  Private/Admin
export const verifyUserManually = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          "verification.status": "verified",
          "verification.method": "manual_admin",
          "verification.verifiedAt": new Date(),
        },
      },
      { new: true, runValidators: false }, // 👈 This prevents the 500 error
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    await AuditLog.create({
      adminId: req.user._id,
      action: "USER_VERIFIED_MANUALLY",
      targetId: updatedUser._id,
      targetModel: "User",
      changes: { method: "manual_admin", status: "verified" },
      ipAddress: req.ip,
    });

    res.status(200).json({
      message: "User manually verified successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Manual Verify Error:", error);
    res
      .status(500)
      .json({ message: "Error updating user verification status" });
  }
};
// ==========================================
// RELEASE QUEUE
// ==========================================

// @desc    Get all pending music releases
// @route   GET /api/admin/releases
// @access  Private/Admin
export const getPendingReleases = async (req, res) => {
  try {
    // 1. Fetch releases (use .lean() so we can modify the objects easily)
    const releases = await Release.find({ status: "pending" })
      .populate("releaseOwner", "stageName email")
      .sort({ createdAt: 1 })
      .lean();

    // 2. Map through each release and sign the audio/artwork keys
    const signedReleases = await Promise.all(
      releases.map(async (release) => {
        // Sign every track's fileUrl
        const signedTracks = await Promise.all(
          release.tracks.map(async (track) => {
            if (!track.fileKey) return track;

            const audioCommand = new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: track.fileKey, // This is why saving the Key was important!
            });

            const freshUrl = await getSignedUrl(s3Client, audioCommand, {
              expiresIn: 3600, // Link valid for 1 hour
            });

            return { ...track, fileUrl: freshUrl };
          }),
        );

        return { ...release, tracks: signedTracks };
      }),
    );

    res.status(200).json(signedReleases);
  } catch (error) {
    console.error("ERROR IN GET PENDING RELEASES:", error);
    res.status(500).json({ message: "Error fetching pending releases" });
  }
};

// @desc    Approve or Reject a release
// @route   PUT /api/admin/releases/:id
// @access  Private/Admin

export const processRelease = async (req, res) => {
  const { status, reason } = req.body;

  try {
    // We populate the owner to get their email and name for the notification
    const release = await Release.findById(req.params.id).populate(
      "releaseOwner",
    );

    if (!release) {
      return res.status(404).json({ message: "Release not found" });
    }
    const oldStatus = release.status;
    release.status = status;

    if (status === "rejected") {
      release.rejectionReason = reason || "No reason provided.";
    } else {
      release.rejectionReason = "";
    }

    await release.save();

    await AuditLog.create({
      adminId: req.user._id,
      action: `RELEASE_${status.toUpperCase()}`,
      targetId: release._id,
      targetModel: "Release",
      changes: { from: oldStatus, to: status, reason: reason || "N/A" },
      ipAddress: req.ip,
    });

    // --- 📧 Trigger Email Notifications ---
    const ownerEmail = req.user?.email;
    const ownerName = release.releaseOwner?.stageName || "Artist";

    if (ownerEmail) {
      try {
        if (status === "distributed") {
          // Or "approved", matching your button value
          await sendReleaseApprovalEmail(ownerEmail, ownerName, release.title);
        } else if (status === "rejected") {
          await sendReleaseRejectionEmail(
            ownerEmail,
            ownerName,
            release.title,
            release.rejectionReason,
          );
        }
      } catch (emailError) {
        // We log the error but don't stop the request; the release is already saved
        console.error("Failed to send notification email:", emailError);
      }
    }

    res.status(200).json({
      message: `Release marked as ${status}`,
      release,
    });
  } catch (error) {
    console.error("Process Release Error:", error);
    res.status(500).json({ message: "Error processing the release" });
  }
};

// @desc    Get dashboard stats for Admin
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const totalArtists = await User.countDocuments({ role: "artist" }); // or just 'user'
    const pendingReleases = await Release.countDocuments({ status: "pending" });

    // Assuming you'll have a Withdrawal model later
    const pendingWithdrawals = await Withdrawal.find({ status: "pending" });
    const totalWithdrawalAmount = pendingWithdrawals.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );

    res.json({
      totalArtists,
      pendingReleases,
      pendingWithdrawals, // Placeholder for now
      totalWithdrawalAmount, // Placeholder
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin stats" });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("adminId", "name email") // Show who did it
      .sort({ timestamp: -1 })
      .limit(200); // Keep it snappy
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};

export const getDistributedReleases = async (req, res) => {
  try {
    // 1. Fetch releases (use .lean() so we can modify the objects easily)
    const releases = await Release.find({ status: "distributed" })
      .populate("releaseOwner", "stageName email")
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(releases);
  } catch (error) {
    console.error("ERROR IN GET DISTRIBUTED RELEASES:", error);
    res.status(500).json({ message: "Error fetching distributed releases" });
  }
};
