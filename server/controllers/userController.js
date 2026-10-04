// controllers/userController.js
import User from "../models/User.js";
import axios from "axios"; // You'll use this to call Paystack/Flutterwave
import { sendSupportSlackNotification } from "../utils/slack.js";

// @desc    Verify user BVN without saving it
// @route   POST /api/users/verify-bvn
// @access  Private
export const verifyBvn = async (req, res) => {
  const { bvn } = req.body;

  if (!bvn || bvn.length !== 11) {
    return res
      .status(400)
      .json({ message: "A valid 11-digit BVN is required." });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Initialize the verification object if it doesn't exist
    if (!user.verification) {
      user.verification = { status: "unverified", method: "none" };
    }

    user.verification.status = "pending";
    user.verification.method = "bvn";
    await user.save();

    // Call Prembly API
    const premblyResponse = await axios.post(
      "https://api.prembly.com/verification/bvn",
      { number: bvn },
      {
        headers: {
          "x-api-key": process.env.PREMBLY_SECRET_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    const apiData = premblyResponse.data;

    if (apiData.status === true || apiData.response_code === "00") {
      const bvnFirstName = apiData.data.firstName?.toLowerCase() || "";
      const bvnLastName = apiData.data.lastName?.toLowerCase() || "";
      const userLegalName = user.legalName.toLowerCase();

      const namesMatch =
        userLegalName.includes(bvnFirstName) ||
        userLegalName.includes(bvnLastName);

      if (namesMatch) {
        user.verification.status = "verified";
      } else {
        user.verification.status = "rejected";
        await user.save();
        return res.status(400).json({
          message:
            "Verification failed. The name on this BVN does not match your registered legal name.",
          verificationStatus: "rejected",
        });
      }
    } else {
      user.verification.status = "rejected";
    }

    await user.save();

    res.status(200).json({
      message: `Identity verification ${user.verification.status === "verified" ? "successful" : "failed"}`,
      verificationStatus: user.verification.status,
    });
  } catch (error) {
    console.error(
      "Prembly BVN API error:",
      error.response?.data || error.message,
    );

    const user = await User.findById(req.user._id);
    if (user) {
      if (!user.verification) user.verification = {};
      user.verification.status = "unverified";
      await user.save();
    }

    res.status(500).json({
      message: "Verification service error. Please try again later.",
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// @desc    Update user profile (Bank Details & Stage Name)
// @route   PUT /api/users/profile
// @access  Private
// @desc    Update user profile (Bank Details & Stage Name)
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // 1. Update basic text fields
    user.stageName = req.body.stageName || user.stageName;

    // 2. Handle Bank Details Update
    if (req.body.bankDetails) {
      user.bankDetails = {
        accountName:
          req.body.bankDetails.accountName || user.bankDetails.accountName,
        accountNumber:
          req.body.bankDetails.accountNumber || user.bankDetails.accountNumber,
        bankName: req.body.bankDetails.bankName || user.bankDetails.bankName,
        bankCode: req.body.bankDetails.bankCode || user.bankDetails.bankCode,
      };
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      stageName: updatedUser.stageName,
      bankDetails: updatedUser.bankDetails,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// @desc    Get all artists signed by a specific scout
// @route   GET /api/scouts/my-artists
// @access  Private (Scout/Admin)
export const getScoutedArtists = async (req, res) => {
  try {
    const artists = await User.find({ scoutedBy: req.user._id }).select(
      "stageName legalName email ninStatus createdAt",
    );
    res.json(artists);
  } catch (error) {
    res.status(500).json({ message: "Error fetching scouted artists" });
  }
};

// @desc    Admin assigns a scout to an artist
// @route   PUT /api/admin/assign-scout
// @access  Private/Admin
export const assignScoutToArtist = async (req, res) => {
  const { artistId, scoutId } = req.body;
  try {
    const artist = await User.findById(artistId);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    artist.scoutedBy = scoutId;
    await artist.save();
    res.json({ message: "Scout assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error assigning scout" });
  }
};

// @desc    Send support or label service request to Slack
// @route   POST /api/users/support
// @access  Private
export const requestSupport = async (req, res) => {
  const { serviceType, message } = req.body;

  if (!serviceType || !message) {
    return res.status(400).json({ message: "Please fill all fields." });
  }

  try {
    const slackMessage = `🚨 *New Support / Label Service Request!*\n*Artist:* ${req.user.stageName} (${req.user.email})\n*Requested Service:* ${serviceType}\n*Message:* ${message}`;

    await sendSupportSlackNotification(slackMessage);

    res.status(200).json({
      message: "Request sent successfully! We will get back to you shortly.",
    });
  } catch (error) {
    res.status(500).json({ message: "Error sending request." });
  }
};

export const collabToggle = async (req, res) => {
  try {
    // 1. Log to verify middleware is working
    const { isAvailableForCollab } = req.body;

    // 2. Check if req.user exists (the 'protect' middleware should handle this, but let's be safe)
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authorized, no user ID" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isAvailableForCollab = isAvailableForCollab;

    await user.save();
    res.status(200).json({
      success: true,
      isAvailableForCollab: user.isAvailableForCollab,
    });
  } catch (error) {
    // 3. THIS IS CRITICAL: Log the actual error to your terminal
    console.error("Collab Toggle Error:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message, // Sending the message back helps debugging during dev
    });
  }
};
