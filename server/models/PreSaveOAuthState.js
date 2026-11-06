import mongoose from "mongoose";

const { Schema } = mongoose;

const preSaveOAuthStateSchema = new Schema(
  {
    stateHash: {
      type: String,
      required: true,
      unique: true,
    },

    guestId: {
      type: String,
      required: true,
      index: true,
    },

    provider: {
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

    // PKCE verifier is encrypted at rest.
    codeVerifierEncrypted: {
      type: String,
      required: true,
      select: false,
    },

    campaignSlug: {
      type: String,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB automatically removes expired authorization attempts.
preSaveOAuthStateSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const PreSaveOAuthState = mongoose.model(
  "PreSaveOAuthState",
  preSaveOAuthStateSchema
);

export default PreSaveOAuthState;
