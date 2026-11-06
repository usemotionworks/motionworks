
import mongoose from "mongoose";
import crypto from "crypto";

import Release from "../models/Release.js";
import PreSaveCampaign from "../models/PreSaveCampaign.js";
import PreSaveRecord from "../models/PreSaveRecord.js";

const PLATFORM_KEYS = [
  "spotify",
  "appleMusic",
  "deezer",
  "youtubeMusic",
  "tidal",
];

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const isAdmin = (user) => user?.role === "admin";

const canManageCampaign = (campaign, user) =>
  isAdmin(user) ||
  (
    user?.role === "artist" &&
    campaign.artistId.toString() === user._id.toString()
  );

const hasTakedown = (release) =>
  Boolean(release.takedownRequest || release.adminTakenDown);

const getInitialCampaignStatus = (release) => {
  if (hasTakedown(release)) return null;

  switch (release.status) {
    case "pending":
      return "awaiting_release_approval";

    case "distributed":
      return "awaiting_platform_setup";

    case "draft":
      return "draft";

    default:
      return null;
  }
};

// Only the backend controls capability, readiness, catalogue IDs
// and processing statuses.

const sanitizePlatforms = (input = {}) => {
  const platforms = {};

  for (const key of PLATFORM_KEYS) {
    if (
      input[key] &&
      typeof input[key].enabled === "boolean"
    ) {
      const enabled = input[key].enabled;

      platforms[key] = {
        enabled,
        status: enabled
          ? "awaiting_verification"
          : "disabled",
      };
    }
  }

  return platforms;
};


const initializePlatform = (campaign, key) => {
  if (!campaign.platforms) {
    campaign.platforms = {};
  }

  if (!campaign.platforms[key]) {
    campaign.platforms[key] = {
      enabled: false,
      capability: "unverified",
      status: "disabled",
      externalTrackIds: [],
    };
  }

  return campaign.platforms[key];
};

const generateUniqueSlug = async (
  title,
  artistName,
  session = null
) => {
  const base =
    slugify(`${artistName}-${title}`) || "presave-campaign";

  for (let attempt = 0; attempt < 10; attempt++) {
    const slug =
      attempt === 0
        ? base
        : `${base}-${crypto.randomBytes(3).toString("hex")}`;

    let query = PreSaveCampaign.findOne({ slug });

    if (session) {
      query = query.session(session);
    }

    const exists = await query;

    if (!exists) return slug;
  }

  throw new Error("Could not generate a unique campaign URL.");
};

const validateCampaignId = (id, res) => {
  if (!isValidId(id)) {
    res.status(400).json({
      message: "Invalid campaign ID.",
    });

    return false;
  }

  return true;
};

// -----------------------------------------------------
// RESPONSE FORMATTERS
// -----------------------------------------------------

const formatArtistNames = (artists = []) =>
  artists.map((artist) => artist?.name).filter(Boolean);

const formatTrack = (track) => ({
  title: track.title,
  trackNumber: track.trackNumber,
  explicit: track.explicit,
  primaryArtists: formatArtistNames(track.primaryArtists),
  featuredArtists: formatArtistNames(track.featuredArtists),
});

const formatReleaseForPublic = (release) => ({
  title: release.title,
  releaseType: release.releaseType,
  artwork: release.artwork,
  releaseDate: release.releaseDate,
  timeZone: release.timeZone,
  primaryArtists: formatArtistNames(release.primaryArtists),
  featuredArtists: formatArtistNames(release.featuredArtists),
  tracks: release.tracks?.map(formatTrack) || [],
});

const formatPlatformsForManagement = (platforms) =>
  Object.fromEntries(
    PLATFORM_KEYS.map((key) => {
      const config = platforms?.[key] || {};

      return [
        key,
        {
          enabled: config.enabled ?? false,
          capability: config.capability || "unverified",
          status: config.status || "disabled",
          externalReleaseId: config.externalReleaseId || null,
          externalReleaseUrl: config.externalReleaseUrl || null,
          externalTrackIds: config.externalTrackIds || [],
          lastCheckedAt: config.lastCheckedAt || null,
        },
      ];
    })
  );

const formatCampaignForManagement = (campaign) => {
  const release = campaign.releaseId;

  return {
    _id: campaign._id,
    slug: campaign.slug,
    status: campaign.status,
    artistId: campaign.artistId,
    createdBy: campaign.createdBy,
    createdByRole: campaign.createdByRole,
    updatedBy: campaign.updatedBy,
    platforms: formatPlatformsForManagement(campaign.platforms),
    totalPreSaves: campaign.totalPreSaves,
    activatedAt: campaign.activatedAt,
    completedAt: campaign.completedAt,
    lastProcessedAt: campaign.lastProcessedAt,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,

    release: release
      ? {
          _id: release._id,
          title: release.title,
          releaseType: release.releaseType,
          artwork: release.artwork,
          releaseDate: release.releaseDate,
          timeZone: release.timeZone,
          status: release.status,
          takedownRequest: release.takedownRequest,
          adminTakenDown: release.adminTakenDown,
          primaryArtists: formatArtistNames(release.primaryArtists),
          featuredArtists: formatArtistNames(release.featuredArtists),
          tracks: release.tracks?.map(formatTrack) || [],
        }
      : null,
  };
};

// -----------------------------------------------------
// CREATE CAMPAIGN
// -----------------------------------------------------

const createCampaign = async (req, res, creatorRole) => {
  const session = await mongoose.startSession();

  try {
    const { releaseId, slug, platforms } = req.body;

    if (!isValidId(releaseId)) {
      return res.status(400).json({
        message: "A valid release ID is required.",
      });
    }

    if (creatorRole !== req.user.role) {
      return res.status(403).json({
        message: "Your account does not have permission to do this.",
      });
    }

    let createdCampaign;

    await session.withTransaction(async () => {
      const release = await Release.findById(releaseId).session(session);

      if (!release) {
        const error = new Error("Release not found.");
        error.statusCode = 404;
        throw error;
      }

      if (
        creatorRole === "artist" &&
        release.releaseOwner.toString() !== req.user._id.toString()
      ) {
        const error = new Error(
          "You can only create campaigns for your own releases."
        );
        error.statusCode = 403;
        throw error;
      }

      if (hasTakedown(release)) {
        const error = new Error(
          "A campaign cannot be created for a release with an active takedown request."
        );
        error.statusCode = 400;
        throw error;
      }

      const initialStatus = getInitialCampaignStatus(release);

      if (!initialStatus) {
        const error = new Error(
          "A campaign cannot be created for a rejected release."
        );
        error.statusCode = 400;
        throw error;
      }

      const existingCampaign = await PreSaveCampaign.findOne({
        releaseId: release._id,
      }).session(session);

      if (existingCampaign) {
        const error = new Error(
          "A pre-save campaign already exists for this release."
        );
        error.statusCode = 409;
        throw error;
      }

      let campaignSlug;

      if (slug !== undefined && slug !== "") {
        campaignSlug = slugify(slug);

        if (!campaignSlug) {
          const error = new Error(
            "Please provide a valid campaign URL slug."
          );
          error.statusCode = 400;
          throw error;
        }

        const existingSlug = await PreSaveCampaign.findOne({
          slug: campaignSlug,
        }).session(session);

        if (existingSlug) {
          const error = new Error(
            "This campaign URL is already in use."
          );
          error.statusCode = 409;
          throw error;
        }
      } else {
        const artistName =
          release.primaryArtists?.[0]?.name ||
          "artist";

        campaignSlug = await generateUniqueSlug(
          release.title,
          artistName,
          session
        );
      }

      const [campaign] = await PreSaveCampaign.create(
        [
          {
            releaseId: release._id,
            artistId: release.releaseOwner,
            createdBy: req.user._id,
            createdByRole: creatorRole,
            updatedBy: req.user._id,
            slug: campaignSlug,
            status: initialStatus,
            platforms: sanitizePlatforms(platforms),
          },
        ],
        { session }
      );

      release.preSaveCampaign = campaign._id;

      await release.save({ session });

      createdCampaign = campaign;
    });

    return res.status(201).json({
      success: true,
      message: "Pre-save campaign created successfully.",
      campaign: {
        _id: createdCampaign._id,
        slug: createdCampaign.slug,
        status: createdCampaign.status,
        releaseId: createdCampaign.releaseId,
        artistId: createdCampaign.artistId,
        platforms: formatPlatformsForManagement(
          createdCampaign.platforms
        ),
        totalPreSaves: createdCampaign.totalPreSaves,
      },
    });
  } catch (error) {
    console.error("Create pre-save campaign error:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "A campaign already exists for this release or URL.",
      });
    }

    return res.status(500).json({
      message: "Failed to create pre-save campaign.",
    });
  } finally {
    await session.endSession();
  }
};

export const createArtistCampaign = async (req, res) => {
  if (req.user?.role !== "artist") {
    return res.status(403).json({
      message: "Artist access required.",
    });
  }

  return createCampaign(req, res, "artist");
};

export const createAdminCampaign = async (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  return createCampaign(req, res, "admin");
};

// -----------------------------------------------------
// GET ARTIST CAMPAIGNS
// -----------------------------------------------------

export const getArtistCampaigns = async (req, res) => {
  try {
    if (req.user?.role !== "artist") {
      return res.status(403).json({
        message: "Artist access required.",
      });
    }

    const campaigns = await PreSaveCampaign.find({
      artistId: req.user._id,
    })
      .populate(
        "releaseId",
        "title releaseType artwork releaseDate timeZone status takedownRequest adminTakenDown primaryArtists featuredArtists"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: campaigns.length,
      campaigns: campaigns.map((campaign) => ({
        _id: campaign._id,
        slug: campaign.slug,
        status: campaign.status,
        platforms: formatPlatformsForManagement(
          campaign.platforms
        ),
        totalPreSaves: campaign.totalPreSaves,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        release: campaign.releaseId
          ? {
              _id: campaign.releaseId._id,
              title: campaign.releaseId.title,
              releaseType: campaign.releaseId.releaseType,
              artwork: campaign.releaseId.artwork,
              releaseDate: campaign.releaseId.releaseDate,
              status: campaign.releaseId.status,
              takedownRequest:
                campaign.releaseId.takedownRequest,
              adminTakenDown:
                campaign.releaseId.adminTakenDown,
              primaryArtists: formatArtistNames(
                campaign.releaseId.primaryArtists
              ),
              featuredArtists: formatArtistNames(
                campaign.releaseId.featuredArtists
              ),
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Get artist campaigns error:", error);

    return res.status(500).json({
      message: "Failed to retrieve campaigns.",
    });
  }
};

// -----------------------------------------------------
// GET CAMPAIGN FOR MANAGEMENT
// -----------------------------------------------------

export const getCampaignForManagement = async (req, res) => {
  try {
    if (!validateCampaignId(req.params.id, res)) return;

    const campaign = await PreSaveCampaign.findById(req.params.id)
      .populate(
        "releaseId",
        "title releaseType artwork releaseDate timeZone status takedownRequest adminTakenDown primaryArtists featuredArtists tracks"
      );

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found.",
      });
    }

    if (!canManageCampaign(campaign, req.user)) {
      return res.status(403).json({
        message: "You do not have permission to manage this campaign.",
      });
    }

    return res.status(200).json({
      success: true,
      campaign: formatCampaignForManagement(campaign),
    });
  } catch (error) {
    console.error("Get campaign management error:", error);

    return res.status(500).json({
      message: "Failed to retrieve campaign.",
    });
  }
};

// -----------------------------------------------------
// UPDATE CAMPAIGN
// -----------------------------------------------------

export const updateCampaign = async (req, res) => {
  try {
    if (!validateCampaignId(req.params.id, res)) return;

    const campaign = await PreSaveCampaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found.",
      });
    }

    if (!canManageCampaign(campaign, req.user)) {
      return res.status(403).json({
        message: "You do not have permission to edit this campaign.",
      });
    }

    const editableStatuses = [
      "draft",
      "awaiting_release_approval",
      "awaiting_platform_setup",
    ];

    if (!editableStatuses.includes(campaign.status)) {
      return res.status(400).json({
        message:
          "This campaign can no longer be edited in its current status.",
      });
    }

    const { slug, platforms } = req.body;

    if (slug !== undefined) {
      const newSlug = slugify(slug);

      if (!newSlug) {
        return res.status(400).json({
          message: "Please provide a valid campaign URL slug.",
        });
      }

      const slugExists = await PreSaveCampaign.findOne({
        slug: newSlug,
        _id: { $ne: campaign._id },
      });

      if (slugExists) {
        return res.status(409).json({
          message: "This campaign URL is already in use.",
        });
      }

      campaign.slug = newSlug;
    }

    if (platforms !== undefined) {
      const sanitized = sanitizePlatforms(platforms);

      for (const key of PLATFORM_KEYS) {
        if (sanitized[key]) {
          const config = initializePlatform(campaign, key);
          const enabled = sanitized[key].enabled;

          config.enabled = enabled;
          config.status = enabled
            ? "awaiting_verification"
            : "disabled";

          if (!enabled) {
            config.externalReleaseId = null;
            config.externalReleaseUrl = null;
            config.externalTrackIds = [];
            config.errorMessage = null;
          }
        }
      }
    }

    campaign.updatedBy = req.user._id;

    await campaign.save();

    return res.status(200).json({
      success: true,
      message: "Campaign updated successfully.",
      campaign: {
        _id: campaign._id,
        slug: campaign.slug,
        status: campaign.status,
        platforms: formatPlatformsForManagement(
          campaign.platforms
        ),
        totalPreSaves: campaign.totalPreSaves,
      },
    });
  } catch (error) {
    console.error("Update campaign error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "This campaign URL is already in use.",
      });
    }

    return res.status(500).json({
      message: "Failed to update campaign.",
    });
  }
};

// -----------------------------------------------------
// CANCEL CAMPAIGN
// -----------------------------------------------------

export const cancelCampaign = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    if (!validateCampaignId(req.params.id, res)) return;

    await session.withTransaction(async () => {
      const campaign = await PreSaveCampaign.findById(
        req.params.id
      ).session(session);

      if (!campaign) {
        const error = new Error("Campaign not found.");
        error.statusCode = 404;
        throw error;
      }

      if (!canManageCampaign(campaign, req.user)) {
        const error = new Error(
          "You do not have permission to cancel this campaign."
        );
        error.statusCode = 403;
        throw error;
      }

      if (campaign.status === "completed") {
        const error = new Error(
          "A completed campaign cannot be cancelled."
        );
        error.statusCode = 400;
        throw error;
      }

      if (campaign.status === "cancelled") {
        const error = new Error(
          "This campaign is already cancelled."
        );
        error.statusCode = 400;
        throw error;
      }

      campaign.status = "cancelled";
      campaign.updatedBy = req.user._id;

      await campaign.save({ session });

      // Stop records waiting to be processed.
      await PreSaveRecord.updateMany(
        {
          campaignId: campaign._id,
          status: { $in: ["pending", "processing"] },
        },
        {
          $set: {
            status: "cancelled",
            processedAt: new Date(),
          },
        },
        { session }
      );
    });

    return res.status(200).json({
      success: true,
      message: "Campaign cancelled successfully.",
    });
  } catch (error) {
    console.error("Cancel campaign error:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to cancel campaign.",
    });
  } finally {
    await session.endSession();
  }
};

// -----------------------------------------------------
// PUBLIC CAMPAIGN RETRIEVAL
// -----------------------------------------------------

export const getPublicCampaign = async (req, res) => {
  try {
    const campaign = await PreSaveCampaign.findOne({
      slug: req.params.slug,
    }).populate(
      "releaseId",
      "title releaseType artwork releaseDate timeZone status takedownRequest adminTakenDown primaryArtists featuredArtists tracks"
    );

    if (!campaign || !campaign.releaseId) {
      return res.status(404).json({
        message: "Campaign not found.",
      });
    }

    const release = campaign.releaseId;

    if (
      ["cancelled", "failed"].includes(campaign.status) ||
      release.status === "rejected" ||
      hasTakedown(release)
    ) {
      return res.status(404).json({
        message: "This campaign is no longer available.",
      });
    }

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,

      campaign: {
        slug: campaign.slug,
        status: campaign.status,

        platforms: Object.fromEntries(
          PLATFORM_KEYS.map((key) => {
            const config = campaign.platforms?.[key] || {};

            return [
              key,
              {
                enabled: config.enabled ?? false,
                capability: config.capability || "unverified",
                status: config.status || "disabled",
                externalReleaseUrl:
                  config.externalReleaseUrl || null,
              },
            ];
          })
        ),

        totalPreSaves: campaign.totalPreSaves,
      },

      release: formatReleaseForPublic(release),
    });
  } catch (error) {
    console.error("Public campaign retrieval error:", error);

    return res.status(500).json({
      message: "Failed to retrieve campaign.",
    });
  }
};

// -----------------------------------------------------
// RELEASE LIFECYCLE SYNCHRONIZATION
// -----------------------------------------------------

// Call this after a release changes status.
// It synchronizes campaigns that have not yet become active.
export const syncPreSaveCampaignForRelease = async (release) => {
  if (!release?._id) return null;

  const campaign = await PreSaveCampaign.findOne({
    releaseId: release._id,
  });

  if (!campaign) return null;

  // Do not overwrite terminal or already active campaign states.
  const synchronizableStatuses = [
    "draft",
    "awaiting_release_approval",
    "awaiting_platform_setup",
  ];

  if (!synchronizableStatuses.includes(campaign.status)) {
    return campaign;
  }

  if (hasTakedown(release)) {
    // The public endpoint and background worker must also
    // check takedown flags. Do not silently reactivate this campaign.
    return campaign;
  }

  if (release.status === "rejected") {
    campaign.status = "failed";
  } else {
    const nextStatus = getInitialCampaignStatus(release);

    if (nextStatus) {
      campaign.status = nextStatus;
    }
  }

  await campaign.save();

  return campaign;
};
