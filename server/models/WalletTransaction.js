
import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "earning",
        "earning_adjustment",
        "payout",
        "payout_reversal",
        "admin_adjustment",
      ],
      required: true,
    },

    // Positive amounts credit; negative amounts debit.
    amountUsd: {
      type: Number,
      required: true,
    },

    balanceBeforeUsd: {
      type: Number,
      required: true,
      min: 0,
    },

    balanceAfterUsd: {
      type: Number,
      required: true,
      min: 0,
    },

    referenceType: {
      type: String,
      enum: ["report", "payout", "admin"],
      required: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

walletTransactionSchema.index({
  wallet: 1,
  createdAt: -1,
});

export default mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);
