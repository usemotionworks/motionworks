
import mongoose from "mongoose";

const { Schema } = mongoose;

const DSP_PLATFORMS = [
  "spotify",
  "appleMusic",
  "deezer",
  "youtubeMusic",
  "tidal",
];

const isrcSearchDiagnosticSchema = new Schema(
  {
    releaseTrackId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    title: {
      type: String,
      trim: true,
    },

    isrc: {
      type: String,
      trim: true,
      uppercase: true,
    },

    marketsChecked: {
      type: [String],
      default: [],
    },

    resultCount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const searchDiagnosticsSchema = new Schema(
  {
    marketsConfigured: {
      type: [String],
      default: [],
    },

    upcSearch: {
      identifier: String,
      searched: {
        type: Boolean,
        default: false,
      },
      marketsChecked: {
        type: [String],
        default: [],
      },
      resultCount: {
        type: Number,
        default: 0,
      },
    },

    isrcSearches: {
      type: [isrcSearchDiagnosticSchema],
      default: [],
    },
  },
  { _id: false }
);

// -----------------------------------------------------
// DSP TRACK CANDIDATE
// -----------------------------------------------------

const candidateTrackSchema = new Schema(
  {
    externalTrackId: {
      type: String,
      trim: true,
    },

    externalTrackUrl: {
      type: String,
      trim: true,
    },

    title: {
      type: String,
      trim: true,
    },

    artists: {
      type: [String],
      default: [],
    },

    isrc: {
      type: String,
      trim: true,
      uppercase: true,
    },
    matchedMarket: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

// -----------------------------------------------------
// DSP RELEASE CANDIDATE
// -----------------------------------------------------

const releaseCandidateSchema = new Schema(
  {
    externalReleaseId: {
      type: String,
      required: true,
      trim: true,
    },

    externalReleaseUrl: {
      type: String,
      trim: true,
    },

    title: {
      type: String,
      trim: true,
    },

    artists: {
      type: [String],
      default: [],
    },

    upc: {
      type: String,
      trim: true,
    },

    releaseDate: {
      type: String,
      trim: true,
    },

    artworkUrl: {
      type: String,
      trim: true,
    },

    tracks: {
      type: [candidateTrackSchema],
      default: [],
    },
    matchedBy: {
      type: [String],
      enum: ["UPC", "ISRC"],
      default: [],
    },

    matchedMarkets: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

// -----------------------------------------------------
// VERIFIED TRACK MAPPING
// -----------------------------------------------------

const verifiedTrackSchema = new Schema(
  {
    releaseTrackId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    externalTrackId: {
      type: String,
      required: true,
      trim: true,
    },

    externalTrackUrl: {
      type: String,
      trim: true,
    },

    verifiedAt: {
      type: Date,
    },

    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false }
);

// -----------------------------------------------------
// MAIN DSP CATALOGUE SCHEMA
// -----------------------------------------------------

const releaseDSPCatalogueSchema = new Schema(
  {
    releaseId: {
      type: Schema.Types.ObjectId,
      ref: "Release",
      required: true,
      index: true,
    },

    platform: {
      type: String,
      enum: DSP_PLATFORMS,
      required: true,
    },

    // Catalogue discovery and verification lifecycle.
    catalogueStatus: {
      type: String,
      enum: [
        "awaiting_catalogue",
        "candidates_found",
        "not_found",
        "verified",
        "failed",
      ],
      default: "awaiting_catalogue",
    },

    // Public availability is independent of catalogue verification.
    availabilityStatus: {
      type: String,
      enum: [
        "unknown",
        "upcoming",
        "available",
        "unavailable",
      ],
      default: "unknown",
    },

    // Search and discovery information.
    lastCheckedAt: {
      type: Date,
      default: null,
    },

    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    errorMessage: {
      type: String,
      default: "",
      trim: true,
    },

    // Search results awaiting admin verification.
    candidates: {
      type: [releaseCandidateSchema],
      default: [],
    },

    // Confirmed DSP release.
    externalReleaseId: {
      type: String,
      default: null,
      trim: true,
    },

    externalReleaseUrl: {
      type: String,
      default: null,
      trim: true,
    },
    // Manually confirmed Spotify for Artists Upcoming information.
    spotifyUpcomingUri: {
      type: String,
      trim: true,
      default: "",
    },

    spotifyUpcomingConfirmedAt: {
      type: Date,
      default: null,
    },

    spotifyUpcomingConfirmedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Mapping between Motion Works tracks and DSP tracks.
    verifiedTracks: {
      type: [verifiedTrackSchema],
      default: [],
    },

    // Availability tracking.
    availabilityCheckedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One catalogue record per release per DSP.
releaseDSPCatalogueSchema.index(
  {
    releaseId: 1,
    platform: 1,
  },
  {
    unique: true,
  }
);

// Useful for admin catalogue queues.
releaseDSPCatalogueSchema.index({
  platform: 1,
  catalogueStatus: 1,
});

releaseDSPCatalogueSchema.index({
  platform: 1,
  availabilityStatus: 1,
});

const ReleaseDSPCatalogue =
  mongoose.models.ReleaseDSPCatalogue ||
  mongoose.model(
    "ReleaseDSPCatalogue",
    releaseDSPCatalogueSchema
  );

export default ReleaseDSPCatalogue;
