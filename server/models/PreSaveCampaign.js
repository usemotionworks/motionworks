
import mongoose from "mongoose";

const { Schema } = mongoose;

const platformConfigSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },

    capability: {
      type: String,
      enum: [
        "native_pre_add",
        "automated_save",
        "link_only",
        "unverified",
      ],
      default: "unverified",
    },

    status: {
      type: String,
      enum: [
        "disabled",
        "awaiting_verification",
        "awaiting_catalogue",
        "ready",
        "active",
        "processing",
        "completed",
        "failed",
      ],
      default: "disabled",
    },

    externalReleaseId: {
      type: String,
      default: null,
    },

    externalReleaseUrl: {
      type: String,
      default: null,
    },

    externalTrackIds: {
      type: [String],
      default: [],
    },

    lastCheckedAt: {
      type: Date,
      default: null,
    },

    errorMessage: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const preSaveCampaignSchema = new Schema(
  {
    releaseId: {
      type: Schema.Types.ObjectId,
      ref: "Release",
      required: true,
      unique: true,
    },

    // The artist whose release this campaign belongs to.
    artistId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // The person who actually created the campaign.
    // Could be the artist or an admin.
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdByRole: {
      type: String,
      enum: ["artist", "admin"],
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "awaiting_release_approval",
        "awaiting_platform_setup",
        "active",
        "processing",
        "completed",
        "cancelled",
        "failed",
      ],
      default: "draft",
      index: true,
    },

    platforms: {
      spotify: {
        type: platformConfigSchema,
        default: () => ({}),
      },

      appleMusic: {
        type: platformConfigSchema,
        default: () => ({}),
      },

      deezer: {
        type: platformConfigSchema,
        default: () => ({}),
      },

      youtubeMusic: {
        type: platformConfigSchema,
        default: () => ({}),
      },

      tidal: {
        type: platformConfigSchema,
        default: () => ({}),
      },
    },

    totalPreSaves: {
      type: Number,
      default: 0,
      min: 0,
    },

    activatedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    lastProcessedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

preSaveCampaignSchema.index({
  artistId: 1,
  createdAt: -1,
});

preSaveCampaignSchema.index({
  status: 1,
  "platforms.spotify.status": 1,
});

const PreSaveCampaign = mongoose.model(
  "PreSaveCampaign",
  preSaveCampaignSchema
);

export default PreSaveCampaign;
