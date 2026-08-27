import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amountUsd: {
      type: Number,
      required: true,
    },
    // Useful if paying out via Paystack/Flutterwave in local currency (e.g., NGN)
    amountNgn: {
      type: Number,
    },
    exchangeRate: {
      type: Number, // USD to NGN rate applied at payout time
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "rejected"],
      default: "pending",
      index: true,
    },
    bankDetails: {
      accountNumber: String,
      bankCode: String,
      bankName: String,
      accountName: String,
      swiftCode: String,
    },
    transferReference: {
      type: String, // Payment provider transfer reference (Paystack / Flutterwave)
    },
    processedAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payout", payoutSchema);
