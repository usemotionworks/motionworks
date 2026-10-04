import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import Release from "../models/Release.js";
import { notifyAdmin } from "../utils/slack.js";
import User from "../models/User.js";
import mongoose from "mongoose";

import dotenv from "dotenv";
dotenv.config();

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");

const toArtistArray = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    // If it's an array of strings, return it.
    // If it's an array of objects (from DB), extract the names.
    return input.map((a) => (typeof a === "object" ? a.name : a));
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export const getPresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType, releaseTitle } = req.body;
    const artistName = req.user.stageName || req.user._id.toString(); // Use Stage Name if available

    // Organized Path: artist/release-title/audio/uuid-filename
    const safeTitle = releaseTitle?.trim() || "untitled-release";
    const folderPath = `music/${slugify(artistName)}/${slugify(safeTitle)}/audio`;
    const fileKey = `${folderPath}/${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    res.status(200).json({ uploadUrl, fileUrl, fileKey });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate upload URL" });
  }
};

// @route   POST /api/users/releases
// @access  Private (Artist)
// @route   POST /api/users/releases
// @access  Private (Artist)
export const createRelease = async (req, res) => {
  try {
    const {
      releaseId,
      isDraft,
      releaseTitle,
      releaseType,
      artworkUrl,
      releaseDate,
      preOrderDate,
      timeZone,
      genre,
      label,
      language,
      cLine,
      pLine,
      upc,
      featuredArtists,
      primaryArtists,
      tracks,
    } = req.body;

    // 1. CONDITIONAL VALIDATION

    // Only run strict checks if the user is actually SUBMITTING (not drafting)
    if (!isDraft) {
      const missingFields = [];

      // Release-Level Checks

      if (!releaseTitle) missingFields.push("Release Title");

      if (!releaseType) missingFields.push("Release Type");

      if (!artworkUrl) missingFields.push("Artwork Cover");

      if (!releaseDate) missingFields.push("Release Date");

      if (!genre) missingFields.push("Genre");

      // Track-Level Checks

      if (!tracks || tracks.length === 0) {
        missingFields.push("At least one audio track");
      } else {
        tracks.forEach((track, index) => {
          const trackName = track.title || `Track ${index + 1}`;

          if (!track.fileUrl && !track.fileKey) {
            missingFields.push(`Audio file for "${trackName}"`);
          }

          // You can also enforce track-level artists here if needed

          if (!track.primaryArtists || track.primaryArtists.length === 0) {
            missingFields.push(`Primary Artist for "${trackName}"`);
          }
        });
      }

      // If anything is missing, block the submission and tell them exactly what it is

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: `Cannot submit release. Please provide the following missing information: ${missingFields.join(", ")}.`,
        });
      }
    }

    // 2. FORMAT DATA


    // 2. FORMAT AND RESOLVE TRACKS

    if (tracks !== undefined && !Array.isArray(tracks)) {
      return res.status(400).json({
        message: "Tracks must be an array.",
      });
    }

    const formattedTracks = [];

    for (let idx = 0; idx < (tracks || []).length; idx++) {
      const track = tracks[idx];

      const {
        _id,
        id,
        createdAt,
        updatedAt,
        ...trackData
      } = track;

      const hasSourceRelease = Boolean(track.sourceReleaseId);
      const hasSourceTrack = Boolean(track.sourceTrackId);

      // A reused track must have both source IDs.
      if (hasSourceRelease !== hasSourceTrack) {
        return res.status(400).json({
          message: `Invalid source reference for track ${idx + 1}.`,
        });
      }

      let originalTrack = null;

      if (hasSourceRelease && hasSourceTrack) {
        // Validate MongoDB IDs before querying.
        if (
          !mongoose.Types.ObjectId.isValid(track.sourceReleaseId) ||
          !mongoose.Types.ObjectId.isValid(track.sourceTrackId)
        ) {
          return res.status(400).json({
            message: `Invalid source ID for track ${idx + 1}.`,
          });
        }

        // Only allow tracks from the artist's own distributed releases.
        const sourceRelease = await Release.findOne({
          _id: track.sourceReleaseId,
          releaseOwner: req.user._id,
          status: "distributed",
        }).select("tracks");

        if (!sourceRelease) {
          return res.status(403).json({
            message: `You cannot reuse track ${idx + 1} from this release.`,
          });
        }

        originalTrack = sourceRelease.tracks.find(
          (sourceTrack) =>
            sourceTrack._id.toString() ===
            track.sourceTrackId.toString()
        );

        if (!originalTrack) {
          return res.status(404).json({
            message: `The original track for track ${idx + 1} was not found.`,
          });
        }
      }

      // Resolve audio and ISRC from the original recording.
      // For new tracks, retain the uploaded audio details.
      const fileUrl = originalTrack
        ? originalTrack.fileUrl
        : trackData.fileUrl;

      const fileKey = originalTrack
        ? originalTrack.fileKey
        : trackData.fileKey;

      const isrc = originalTrack
        ? originalTrack.isrc
        : trackData.isrc;

      formattedTracks.push({
        ...trackData,

        // Never copy a source subdocument's MongoDB _id.
        trackNumber: trackData.trackNumber || idx + 1,

        fileUrl,
        fileKey,
        isrc,

        // Normalize the references.
        sourceReleaseId: originalTrack
          ? track.sourceReleaseId
          : null,

        sourceTrackId: originalTrack
          ? track.sourceTrackId
          : null,

        primaryArtists: toArtistArray(trackData.primaryArtists).map(
          (name) => ({
            name,
            user: null,
          })
        ),

        featuredArtists: toArtistArray(trackData.featuredArtists).map(
          (name) => ({
            name,
            user: null,
          })
        ),

        writers: Array.isArray(trackData.writers)
          ? trackData.writers.map((w) => ({
              legalName: w.legalName,
              roles: w.roles || [],
              user: w.user || null,
            }))
          : [],

        additionalCredits: Array.isArray(trackData.additionalCredits)
          ? trackData.additionalCredits.map((c) => ({
              name: c.name,
              roles: c.roles || [],
              user: c.user || null,
            }))
          : [],

        splits: Array.isArray(trackData.splits)
          ? trackData.splits.map((s) => ({
              name: s.name,
              category: s.category,
              creditRole: s.creditRole,
              percentage: s.percentage,
              user: s.user || null,
            }))
          : [],
      });
    }

    // 3. SECURE IP DETECTION

    const rawIp =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;

    // Remove IPv6 prefix if present (e.g., "::ffff:127.0.0.1" -> "127.0.0.1")

    const cleanIp =
      typeof rawIp === "string" && rawIp.startsWith("::ffff:")
        ? rawIp.replace("::ffff:", "")
        : rawIp;

    if (!isDraft) {
      const signedName = req.body.legalConsent?.signedName

        ?.trim()

        .toLowerCase();

      const registeredName = req.user.legalName?.trim().toLowerCase(); // Use the legal name field in your User model

      if (!signedName || signedName !== registeredName) {
        return res.status(400).json({
          message: `Signature mismatch. Please type your full legal name exactly as registered: ${req.user.legalName}`,
        });
      }
    }

    // 3. THE "UPSERT" LOGIC (Update or Create)

    const releaseData = {
      releaseOwner: req.user._id,
      title: releaseTitle,
      releaseType,
      artwork: artworkUrl,
      releaseDate,
      preOrderDate,
      timeZone,
      genre,
      label,
      language,
      cLine,
      pLine,
      upc,
      primaryArtists: toArtistArray(primaryArtists).map((name) => ({
        name,

        user: null,
      })),

      featuredArtists: toArtistArray(featuredArtists).map((name) => ({
        name,

        user: null,
      })),

      tracks: formattedTracks, // 🚀 Now includes splits/credits

      status: isDraft ? "draft" : "pending",
    };

    if (!isDraft) {
      releaseData.rejectionReason = "";
    }

    // 🚀 Only Attach/Update Legal if it's a Submission

    if (!isDraft) {
      releaseData.legalConsent = {
        agreed: req.body.legalConsent?.agreed || false,

        signedName: req.body.legalConsent?.signedName || "",

        ipAddress: cleanIp,

        agreedAt: new Date(), // This tracks the MOMENT of submission

        version: "1.0.0",
      };
    }

    let savedRelease;

    let isInitialSubmission = false; // 👈 Track if this is the FIRST submission

    if (releaseId) {
      // Find the old version first to check status

      const oldRelease = await Release.findOne({
        _id: releaseId,

        releaseOwner: req.user._id,
      });

      // If it was a draft and is now being submitted (!isDraft)

      if (oldRelease && oldRelease.status === "draft" && !isDraft) {
        isInitialSubmission = true;
      }

      savedRelease = await Release.findOneAndUpdate(
        { _id: releaseId, releaseOwner: req.user._id },

        { $set: releaseData },

        { new: true, runValidators: !isDraft },
      );
    } else {
      savedRelease = await Release.create(releaseData);

      // If created as a direct submission (not a draft)

      if (!isDraft) isInitialSubmission = true;
    }

    // 🚀 Update User Stats & Rank

    if (isInitialSubmission) {
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,

        { $inc: { releaseCount: 1 } },

        { new: true },
      );

      // Promotion Logic

      let newRank = "Newcomer";

      if (updatedUser.releaseCount >= 5) newRank = "Pro";
      else if (updatedUser.releaseCount >= 1) newRank = "Rising";

      if (updatedUser.artistRank !== newRank) {
        updatedUser.artistRank = newRank;

        await updatedUser.save();
      }
    }

    // 4. CONDITIONAL SLACK TRIGGER

    // We only ping Slack if it's a real submission

    if (!isDraft) {
      notifyAdmin(
        `💥 New Release: ${releaseTitle}, Tracks: ${tracks.length}, Primary Artists: ${primaryArtists}`,
      );
    }

    res.status(releaseId ? 200 : 201).json({
      message: isDraft
        ? "Draft saved successfully!"
        : "Release submitted successfully!",

      release: savedRelease,
    });
  } catch (error) {
    console.error("Error saving release:", error);

    // 🚀 NEW: Check if this is a Mongoose Validation Error

    if (error.name === "ValidationError") {
      // Extract the first error message (e.g., "title: Path `title` is required")

      // and clean it up for the user

      const messages = Object.values(error.errors).map((val) => val.message);

      return res.status(400).json({
        message: ` ${messages.join(", ")}`,
      });
    }

    // Default fall-back for actual system/db crashes

    res.status(500).json({
      message: "An unexpected server error occurred. Please try again.",
    });
  }
};

// @desc    Get all releases for the logged-in artist's dashboard
// @route   GET /api/users/releases
// @access  Private (Artist)

export const getUserReleases = async (req, res) => {
  try {
    // Find by releaseOwner (the ID of the person who created the draft/submission)
    const releases = await Release.find({ releaseOwner: req.user._id })
      .populate("releaseOwner", "stageName")
      .sort({ createdAt: -1 });

    res.status(200).json(releases);
  } catch (error) {
    console.error("Error fetching releases:", error);
    res.status(500).json({ message: "Server error while fetching releases." });
  }
};

export const uploadArtwork = async (req, res) => {
  try {
    const { releaseTitle } = req.body; // Sent via FormData
    const artistName = req.user.stageName || req.user._id.toString();

    if (!req.file)
      return res.status(400).json({ message: "No artwork provided." });

    const fileExt = req.file.originalname.split(".").pop();
    // Organized Path: artist/release-title/artwork/uuid.ext
    const folderPath = `/music/${slugify(artistName)}/${slugify(releaseTitle || "untitled")}/artwork`;
    const fileKey = `${folderPath}/${uuidv4()}.${fileExt}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    await s3Client.send(command);
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    res.status(200).json({ imageUrl });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to upload artwork. Make sure it's a valid image file.",
      });
  }
};

// @desc    Get a single release by ID
// @route   GET /api/releases/:id
// @access  Private (Artist)
export const getReleaseById = async (req, res) => {
  try {
    // Admins can access any release
    // Regular users can only access their own
    const query =
      req.user.role === "admin"
        ? { _id: req.params.id }
        : {
            _id: req.params.id,
            releaseOwner: req.user._id,
          };

    const release = await Release.findOne(query);

    if (!release) {
      return res.status(404).json({
        message: "Release not found.",
      });
    }

    res.status(200).json(release);
  } catch (error) {
    console.error("Error fetching release:", error);

    res.status(500).json({
      message: "Server error while fetching release details.",
    });
  }
};

export const takedownSong = async (req, res) => {
  try {
    const query =
      req.user.role === "admin"
        ? {
            _id: req.params.id,
            status: "distributed",
          }
        : {
            _id: req.params.id,
            releaseOwner: req.user._id,
            status: "distributed",
          };

    const release = await Release.findOneAndUpdate(
      query,
      { takedownRequest: true },
      { new: true }
    );

    if (!release) {
      return res.status(404).json({
        message: "Distributed release not found.",
      });
    }

    const user = await User.findById(release.releaseOwner);

    if (user) {
      notifyAdmin(
        `💥 Takedown Request: ${release.title}, user: ${user.stageName}`
      );
    }

    return res.status(200).json({
      message: "Takedown request submitted successfully.",
      release,
    });
  } catch (error) {
    console.error("Error requesting takedown:", error);

    return res.status(500).json({
      message: "Server error while requesting takedown.",
    });
  }
};



// @desc    Get tracks from the artist's distributed releases
// @route   GET /api/users/releases/reusable-tracks
// @access  Private (Artist)

export const getReusableTracks = async (req, res) => {
  try {
    const releases = await Release.find({
      releaseOwner: req.user._id,
      status: "distributed",
    })
      .select("title releaseType tracks createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const reusableReleases = releases.map((release) => ({
      releaseId: release._id,
      releaseTitle: release.title,
      releaseType: release.releaseType,
      tracks: release.tracks.map((track) => ({
        trackId: track._id,
        title: track.title,
        lyrics: track.lyrics || "",
        isrc: track.isrc || "",
        explicit: track.explicit,
        primaryArtists: track.primaryArtists || [],
        featuredArtists: track.featuredArtists || [],
        writers: track.writers || [],
        additionalCredits: track.additionalCredits || [],
        fileUrl: track.fileUrl,
        fileKey: track.fileKey,
      })),
    }));

    return res.status(200).json({
      releases: reusableReleases,
    });
  } catch (error) {
    console.error("Error fetching reusable tracks:", error);

    return res.status(500).json({
      message: "Unable to fetch previously released tracks.",
    });
  }
};
