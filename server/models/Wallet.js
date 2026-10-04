import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    currency: {
      type: String,
      default: "USD",
      enum: ["USD"],
    },

    balanceUsd: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalEarnedUsd: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalWithdrawnUsd: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);
