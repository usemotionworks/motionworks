
import mongoose from "mongoose";

const backupJobSchema = new mongoose.Schema(
  {
    releaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Release",
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },

    requestedUpdatedAt: {
      type: Date,
      default: Date.now,
    },

    processedUpdatedAt: {
      type: Date,
      default: null,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    nextAttemptAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lockToken: {
      type: String,
      default: null,
    },

    lockedUntil: {
      type: Date,
      default: null,
    },

    lastError: {
      type: String,
      default: "",
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

backupJobSchema.index({ status: 1, nextAttemptAt: 1 });
backupJobSchema.index({ status: 1, lockedUntil: 1 });

const BackupJob = mongoose.model("BackupJob", backupJobSchema);

export default BackupJob;
