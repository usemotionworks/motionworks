
import mongoose from "mongoose";

const { Schema } = mongoose;

const preSaveRecordSchema = new Schema(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "PreSaveCampaign",
      required: true,
      index: true,
    },

    authorizationId: {
      type: Schema.Types.ObjectId,
      ref: "PreSaveAuthorization",
      required: true,
    },

    platform: {
      type: String,
      enum: [
        "spotify",
        "appleMusic",
        "deezer",
        "youtubeMusic",
        "tidal",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "saved",
        "failed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    externalItemId: {
      type: String,
      default: null,
    },

    targetType: {
      type: String,
      enum: ["track", "album"],
      default: null,
    },

    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastAttemptAt: {
      type: Date,
      default: null,
    },

    nextAttemptAt: {
      type: Date,
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    savedAt: {
      type: Date,
      default: null,
    },

    failureCode: {
      type: String,
      default: null,
    },

    failureMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pre-save registrations.
preSaveRecordSchema.index(
  {
    campaignId: 1,
    authorizationId: 1,
    platform: 1,
  },
  {
    unique: true,
  }
);

preSaveRecordSchema.index({
  campaignId: 1,
  status: 1,
});

preSaveRecordSchema.index({
  status: 1,
  nextAttemptAt: 1,
});

const PreSaveRecord = mongoose.model(
  "PreSaveRecord",
  preSaveRecordSchema
);

export default PreSaveRecord;
