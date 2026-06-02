import mongoose from "mongoose";

// ----------------------------------------------------
// 1. SMARTLINK SCHEMA (The Parent Document)
// ----------------------------------------------------
const smartlinkSchema = new mongoose.Schema(
  {
    releaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Release",
      required: true,
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slug: { type: String, required: true, unique: true }, // e.g., "stay-cruising"
    isrc: { type: String },
    upc: { type: String },
    title: String,
    artistName: String,
    coverArt: String,
    // Object storing the actual target streaming links
    links: {
      type: Map,
      of: {
        type: String,
        validate: {
          validator: (v) => /^https?:\/\//.test(v),
          message: "Invalid URL",
        },
      },
      default: {},
    },
    totalClicks: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Smartlink = mongoose.model("Smartlink", smartlinkSchema);

// ----------------------------------------------------
// 2. ANALYTICS SCHEMA (The Raw Click Log)
// ----------------------------------------------------
const analyticsSchema = new mongoose.Schema(
  {
    smartlinkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Smartlink",
      required: true,
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Duplicated for fast aggregation querying by artist
    platform: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    // 📱 Device Context Information
    device: {
      type: {
        type: String,
        enum: ["mobile", "tablet", "desktop", "unknown"],
        default: "unknown",
      },
      os: { type: String, default: "unknown" }, // e.g., "iOS", "Android", "Windows"
      browser: { type: String, default: "unknown" }, // e.g., "Safari", "Chrome", "Instagram WebView"
    },

    // 🌍 Location Context Information (Derived from IP on backend)
    location: {
      countryCode: { type: String, default: "Unknown" }, // e.g., "NG", "US", "UK"
      country: { type: String, default: "Unknown" }, // e.g., "Nigeria", "United States"
      region: { type: String, default: "Unknown" }, // e.g., "Lagos", "California"
      city: { type: String, default: "Unknown" }, // e.g., "Ikeja", "Los Angeles"
    },

    referrer: { type: String, default: "direct" }, // e.g., "instagram.com", "t.co" (Twitter), "tiktok.com"
  },
  { timestamps: { createdAt: true, updatedAt: false } },
); // Only log when it was created

// 🚀 Performance Indexing for fast aggregations later
analyticsSchema.index({ smartlinkId: 1, createdAt: -1 });
analyticsSchema.index({ artistId: 1 });
analyticsSchema.index({ "location.countryCode": 1 });
analyticsSchema.index({ platform: 1 });

export const SmartlinkAnalytics = mongoose.model(
  "SmartlinkAnalytics",
  analyticsSchema,
);
