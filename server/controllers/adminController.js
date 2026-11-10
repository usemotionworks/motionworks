// controllers/adminController.js
import User from "../models/User.js";
import Release from "../models/Release.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {s3Client} from "../config/s3.js"
import {
  sendReleaseApprovalEmail,
  sendReleaseRejectionEmail,
  sendTakedownApprovalEmail
} from "../utils/emailService.js";
import AuditLog from "../models/AuditLog.js";
import Payout from "../models/Payout.js";
import { completePayout, reversePayout } from "../service/walletService.js";

import {
  syncPreSaveCampaignForRelease,
} from "./preSaveController.js";
import {
  discoverSpotifyCatalogue,
} from "../services/dsp/spotify/spotifyCatalogueService.js";
import ReleaseDSPCatalogue from "../models/ReleaseDSPCatalogue.js";



import dotenv from "dotenv";
dotenv.config();

const DSP_PLATFORMS = [
  "spotify",
  "appleMusic",
  "deezer",
  "youtubeMusic",
  "tidal",
];


// @desc    Get all pending withdrawals
// @route   GET /api/admin/withdrawals
// @access  Private/Admin
export const getPendingWithdrawals = async (req, res) => {
  try {
    const pendingRequests = await Payout.find({ status: "pending" })
      .populate("user", "legalName stageName email")
      .sort({ createdAt: 1 }); // Oldest first

    res.status(200).json(pendingRequests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending withdrawals", error: error.message });
  }
};
// @desc    Approve or Reject a withdrawal
// @route   PUT /api/admin/withdrawals/:id
// @access  Private/Admin


export const processWithdrawal = async (req, res) => {
  const { action, notes } = req.body;
  const payoutId = req.params.id;

  try {
    const payout = await Payout.findById(payoutId);

    if (!payout) {
      return res.status(404).json({
        message: "Payout request not found",
      });
    }

    if (payout.status !== "pending") {
      return res.status(400).json({
        message: "This request has already been processed.",
      });
    }

    if (action === "approve") {
      // Complete the payout and update wallet accounting.
      await completePayout({
        userId: payout.user,
        payoutId: payout._id,
      });

      await AuditLog.create({
        adminId: req.user._id,
        action: `approved payout of ${payout.amountUsd} USD`,
        targetId: payout._id,
        notes: notes || "Processed successfully.",
      });

      return res.status(200).json({
        message: "Payout approved and marked completed.",
      });
    }

    if (action === "reject") {
      // Reverse the reservation and return funds to the wallet.
      await reversePayout({
        userId: payout.user,
        payoutId: payout._id,
        status: "rejected",
      });

      // Save the admin's rejection reason.
      await Payout.findByIdAndUpdate(payout._id, {
        failureReason: notes || "Rejected by admin",
        processedAt: new Date(),
      });

      await AuditLog.create({
        adminId: req.user._id,
        action: `rejected payout of ${payout.amountUsd} USD`,
        targetId: payout._id,
        notes: notes || "Rejected by admin",
      });

      return res.status(200).json({
        message: "Payout rejected. Funds have been returned to the user's wallet.",
      });
    }

    return res.status(400).json({
      message: "Invalid action type",
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);

    return res.status(500).json({
      message: "Error processing the withdrawal",
      error: error.message,
    });
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

  if (!["distributed", "rejected"].includes(status)) {
    return res.status(400).json({
      message: "Invalid release status. Use distributed or rejected.",
    });
  }

  try {
    const release = await Release.findById(req.params.id).populate(
      "releaseOwner",
      "stageName email"
    );

    if (!release) {
      return res.status(404).json({
        message: "Release not found",
      });
    }

    if (release.status !== "pending") {
      return res.status(409).json({
        message: "This release has already been processed.",
        currentStatus: release.status,
      });
    }

    const oldStatus = release.status;

    // Validate and attach distributor identifiers before distribution.
    if (status === "distributed") {
      const upc = String(req.body.upc || "").trim();

      // Accept standard GTIN/UPC lengths.
      if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(upc)) {
        return res.status(400).json({
          message: "Enter a valid UPC/EAN code (8, 12, 13, or 14 digits).",
        });
      }

      const submittedTrackIsrcs = req.body.trackIsrcs;

      if (!Array.isArray(submittedTrackIsrcs)) {
        return res.status(400).json({
          message: "Track ISRC details are required.",
        });
      }

      if (!release.tracks?.length) {
        return res.status(400).json({
          message: "This release has no tracks to distribute.",
        });
      }

      const isrcByTrackId = new Map();

      for (const item of submittedTrackIsrcs) {
        const trackId = String(item?.trackId || "").trim();
        const isrc = String(item?.isrc || "").trim().toUpperCase();

        if (!trackId || !isrc) {
          return res.status(400).json({
            message: "Every track must have an ISRC.",
          });
        }

        if (!/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(isrc)) {
          return res.status(400).json({
            message: `Invalid ISRC format for track ${trackId}.`,
          });
        }

        if (isrcByTrackId.has(trackId)) {
          return res.status(400).json({
            message: "A track has been submitted more than once.",
          });
        }

        isrcByTrackId.set(trackId, isrc);
      }

      if (isrcByTrackId.size !== release.tracks.length) {
        return res.status(400).json({
          message: "An ISRC must be provided for every track.",
        });
      }

      const seenIsrcs = new Set();

      for (const track of release.tracks) {
        const trackId = track._id.toString();
        const isrc = isrcByTrackId.get(trackId);

        if (!isrc) {
          return res.status(400).json({
            message: `Missing ISRC for "${track.title}".`,
          });
        }

        if (seenIsrcs.has(isrc)) {
          return res.status(400).json({
            message: `The ISRC ${isrc} has been assigned to more than one track.`,
          });
        }

        seenIsrcs.add(isrc);
        track.isrc = isrc;
      }

      // Release-level identifier.
      release.upc = upc;

      // Initialise catalogue records. $setOnInsert preserves existing records.
      await ReleaseDSPCatalogue.bulkWrite(
        DSP_PLATFORMS.map((platform) => ({
          updateOne: {
            filter: {
              releaseId: release._id,
              platform,
            },
            update: {
              $setOnInsert: {
                releaseId: release._id,
                platform,
                catalogueStatus: "awaiting_catalogue",
                availabilityStatus: "unknown",
              },
            },
            upsert: true,
          },
        }))
      );
    }

    if (status === "rejected") {
      await ReleaseDSPCatalogue.deleteMany({
        releaseId: release._id,
      });
    }

    release.status = status;
    release.rejectionReason =
      status === "rejected"
        ? reason?.trim() || "No reason provided."
        : "";

    // One save persists status, UPC and all track ISRCs together.
    await release.save();

    let campaignSyncSuccessful = true;

    try {
      await syncPreSaveCampaignForRelease(release);
    } catch (syncError) {
      campaignSyncSuccessful = false;
      console.error(
        "Pre-save campaign synchronization failed:",
        syncError
      );
    }

    await AuditLog.create({
      adminId: req.user._id,
      action: `RELEASE_${status.toUpperCase()}`,
      targetId: release._id,
      targetModel: "Release",
      changes: {
        from: oldStatus,
        to: status,
        reason:
          status === "rejected"
            ? release.rejectionReason
            : "N/A",
      },
      ipAddress: req.ip,
    });

    const ownerEmail = release.releaseOwner?.email;
    const ownerName = release.releaseOwner?.stageName || "Artist";

    if (ownerEmail) {
      try {
        if (status === "distributed") {
          await sendReleaseApprovalEmail(
            ownerEmail,
            ownerName,
            release.title
          );
        } else {
          await sendReleaseRejectionEmail(
            ownerEmail,
            ownerName,
            release.title,
            release.rejectionReason
          );
        }
      } catch (emailError) {
        console.error(
          "Failed to send release notification email:",
          emailError
        );
      }
    }

    return res.status(200).json({
      message: `Release marked as ${status}`,
      release,
      campaignSyncSuccessful,
      catalogueRecordsInitialized: status === "distributed",
    });
  } catch (error) {
    console.error("Process Release Error:", error);

    return res.status(500).json({
      message: "Error processing the release",
    });
  }
};



// @desc    Get dashboard stats for Admin
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const totalArtists = await User.countDocuments({ role: "artist" }); // or just 'user'
    const pendingReleases = await Release.countDocuments({ status: "pending" });
    const takedownRequests = await Release.countDocuments({ takedownRequest: true , adminTakenDown: false});

    const pendingWithdrawals = await Payout.find({ status: "pending" });


    res.json({
      totalArtists,
      pendingReleases,
      takedownRequests,
      pendingWithdrawals, // Placeholder for now
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
    // Fetch distributor-approved releases.
    const releases = await Release.find({
      status: "distributed",
    })
      .populate("releaseOwner", "stageName")
      .sort({ createdAt: 1 })
      .lean();

    if (!releases.length) {
      return res.status(200).json([]);
    }

    // Fetch all DSP catalogue records belonging to these releases.
    const releaseIds = releases.map((release) => release._id);

    const catalogueRecords = await ReleaseDSPCatalogue.find({
      releaseId: { $in: releaseIds },
    }).lean();

    // Group catalogue records by release ID and platform.
    const catalogueMap = new Map();

    for (const record of catalogueRecords) {
      const releaseId = String(record.releaseId);

      if (!catalogueMap.has(releaseId)) {
        catalogueMap.set(releaseId, {});
      }

      catalogueMap.get(releaseId)[record.platform] = record;
    }

    // Only expose artist display names, not internal user references.
    const formatArtists = (artists = []) =>
      artists
        .filter((artist) => artist?.name)
        .map((artist) => ({
          name: artist.name,
        }));

    const formattedReleases = releases.map((release) => {
      const releaseCatalogues =
        catalogueMap.get(String(release._id)) || {};

      // Always return all five platforms, even if a record is missing.
      const dspCatalogues = Object.fromEntries(
        DSP_PLATFORMS.map((platform) => {
          const record = releaseCatalogues[platform];

          return [
            platform,
            record
              ? {
                  _id: record._id,
                  catalogueStatus: record.catalogueStatus,
                  availabilityStatus: record.availabilityStatus,

                  lastCheckedAt: record.lastCheckedAt,
                  attemptCount: record.attemptCount,
                  errorMessage: record.errorMessage,

                  candidates: (record.candidates || []).map(
                    (candidate) => ({
                      externalReleaseId: candidate.externalReleaseId,
                      externalReleaseUrl: candidate.externalReleaseUrl,
                      title: candidate.title,
                      artists: candidate.artists || [],
                      upc: candidate.upc,
                      releaseDate: candidate.releaseDate,
                      artworkUrl: candidate.artworkUrl,

                      tracks: (candidate.tracks || []).map((track) => ({
                        externalTrackId: track.externalTrackId,
                        externalTrackUrl: track.externalTrackUrl,
                        title: track.title,
                        artists: track.artists || [],
                        isrc: track.isrc,
                      })),
                    })
                  ),

                  externalReleaseId: record.externalReleaseId,
                  externalReleaseUrl: record.externalReleaseUrl,

                  verifiedAt: record.verifiedAt,
                  verifiedBy: record.verifiedBy,

                  verifiedTracks: (record.verifiedTracks || []).map(
                    (track) => ({
                      releaseTrackId: track.releaseTrackId,
                      externalTrackId: track.externalTrackId,
                      externalTrackUrl: track.externalTrackUrl,
                      verifiedAt: track.verifiedAt,
                      verifiedBy: track.verifiedBy,
                    })
                  ),

                  availabilityCheckedAt: record.availabilityCheckedAt,
                }
              : {
                  _id: null,
                  catalogueStatus: "awaiting_catalogue",
                  availabilityStatus: "unknown",
                  lastCheckedAt: null,
                  attemptCount: 0,
                  errorMessage: "",
                  candidates: [],
                  externalReleaseId: null,
                  externalReleaseUrl: null,
                  verifiedAt: null,
                  verifiedBy: null,
                  verifiedTracks: [],
                  availabilityCheckedAt: null,
                },
          ];
        })
      );

      return {
        _id: release._id,
        title: release.title,
        releaseType: release.releaseType,
        artwork: release.artwork,
        releaseDate: release.releaseDate,
        timeZone: release.timeZone,
        genre: release.genre,
        label: release.label,
        language: release.language,
        upc: release.upc || null,
        smartlink: release.smartlink,

        releaseOwner: {
          stageName: release.releaseOwner?.stageName || "Unknown Artist",
        },

        primaryArtists: formatArtists(release.primaryArtists),
        featuredArtists: formatArtists(release.featuredArtists),

        tracks: (release.tracks || []).map((track) => ({
          _id: track._id,
          title: track.title,
          trackNumber: track.trackNumber,
          isrc: track.isrc || null,
          primaryArtists: formatArtists(track.primaryArtists),
          featuredArtists: formatArtists(track.featuredArtists),
        })),

        dspCatalogues,

        createdAt: release.createdAt,
      };
    });

    return res.status(200).json(formattedReleases);
  } catch (error) {
    console.error("ERROR IN GET DISTRIBUTED RELEASES:", error);

    return res.status(500).json({
      message: "Error fetching distributed releases",
    });
  }
};



export const processTakedown = async (req, res) => {
  const {  reason } = req.body;


  try {
    // We populate the owner to get their email and name for the notification
    const release = await Release.findByIdAndUpdate(
      req.params.id,
      { adminTakenDown: true },
      { new: true }
    );

    if (!release) {
      return res.status(404).json({ message: "Release not found" });
    }


    await AuditLog.create({
      adminId: req.user._id,
      action: `RELEASE_TAKENDOWN`,
      targetId: release._id,
      targetModel: "Release",
      changes: { from: false, to:true, reason: reason || "N/A" },
      ipAddress: req.ip,
    });

    const user = await User.findById(release.releaseOwner)

    // --- 📧 Trigger Email Notifications ---
    const ownerEmail = user?.email;
    const ownerName = release.releaseOwner?.stageName || "Artist";


    if (ownerEmail) {
      try {
          // Or "approved", matching your button value
          await sendTakedownApprovalEmail(ownerEmail, ownerName, release.title);

      } catch (emailError) {
        // We log the error but don't stop the request; the release is already saved
        console.error("Failed to send notification email:", emailError);
      }
    }

    res.status(200).json({
      message: `Release marked as Taken Down`,
      release,
    });
  } catch (error) {
    console.error("Process Release Error:", error);
    res.status(500).json({ message: "Error processing the release" });
  }
};

export const getPendingTakedowns = async (req, res) => {
  try {
    const releases = await Release.find({
      takedownRequest: true,
      adminTakenDown: false,
    })
      .populate("releaseOwner", "stageName email")
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(releases);
  } catch (error) {
    console.error("ERROR IN GET PENDING TAKEDOWN REQUESTS:", error);

    res.status(500).json({
      message: "Error fetching pending Takedown requests",
    });
  }
};


export const discoverSpotifyRelease = async (req, res) => {

  try {
    const result = await discoverSpotifyCatalogue(req.params.id);



    return res.status(200).json(result);
  } catch (error) {
    console.error("Spotify Discovery Controller Error:", error);

    const statusCode =
      error.message === "Release not found"
        ? 404
        : error.message.includes("Only distributor-approved") ||
          error.message.includes("unavailable for catalogue discovery")
        ? 400
        : 502;

    return res.status(statusCode).json({
      message: error.message || "Spotify catalogue discovery failed.",
    });
  }
};
