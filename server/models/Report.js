import mongoose from "mongoose";

export const ALLOWED_DSPS = [
  "iTunes / Apple Music + Shazam",
  "Deezer",
  "Spotify",
  "YouTube Music",
  "Tidal",
  "Amazon",
  "AMI Entertainment",
  "Qobuz",
  "Pandora",
  "KKBOX",
  "7Digital + Snapchat",
  "iMusica",
  "Soundcloud",
  "iHeartRadio",
  "Anghami",
  "SoundExchange",
  "JioSaavn",
  "AWA",
  "NetEase",
  "Sirius XM",
  "YouTube Content ID",
  "Facebook Audio Library",
  "Facebook Rights Manager",
  "Mixcloud",
  "TikTok",
  "Boomplay",
  "Peloton",
  "Audiomack",
  "Gaana",
  "Kuack",
  "Kuaishou",
  "Audible Magic",
  "Tuned Global / Line Music",
  "Lissen",
];

const TrackReportSchema = new mongoose.Schema({
  isrc: { type: String, trim: true },
  title: { type: String, required: true },
  streams: { type: Number, default: 0 },
  consumptionUnits: { type: Number, default: 0 },
  revenueUsd: { type: Number, default: 0 },
});

const ReportSchema = new mongoose.Schema(
  {
    releaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Release",
      required: true,
      index: true,
    },

    // Format: "YYYY-MM" (e.g., "2026-07") for month-by-month filtering and sorting
    reportMonth: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },

    // Aggregate monthly totals for the overall release
    totalStreams: { type: Number, default: 0 },
    totalConsumptionUnits: { type: Number, default: 0 },
    totalRevenueUsd: { type: Number, default: 0 },

    // Track-level metrics (Handles Singles, EPs, Albums, and Compilations)
    tracks: [TrackReportSchema],

    // Strictly validated DSP breakdowns
    dspBreakdown: [
      {
        dspName: {
          type: String,
          enum: ALLOWED_DSPS,
          required: true,
        },
        streams: { type: Number, default: 0 },
        consumptionUnits: { type: Number, default: 0 },
        revenueUsd: { type: Number, default: 0 },
      },
    ],

    // Distribution channel breakdown
    channelBreakdown: [
      {
        channel: {
          type: String,
          enum: [
            "Subscription Streaming",
            "Ad-Supported Streaming",
            "UGC Licensing",
            "UGC Consumption",
            "UGC Ad Revenue Share",
            "Claimed UGC",
            "Download",
            "Other",
          ],
          required: true,
        },
        streams: { type: Number, default: 0 },
        consumptionUnits: { type: Number, default: 0 },
        revenueUsd: { type: Number, default: 0 },
      },
    ],

    // Sorting & Audit fields
    lastUpdatedMonth: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
          type: String,
          enum: ["draft", "submitted"],
          default: "draft",
        },
  },
  { timestamps: true }
);

// Prevent redundant reports per release/month combination
ReportSchema.index({ releaseId: 1, reportMonth: 1 }, { unique: true });

// Index to optimize frontend sorting by report month and update timestamps
ReportSchema.index({ reportMonth: -1, lastUpdatedMonth: -1 });

export default mongoose.model("Report", ReportSchema);
