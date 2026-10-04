import Report from "../models/Report.js";
import Release from "../models/Release.js";
import Payout from "../models/Payout.js";
import mongoose from "mongoose";
import { reservePayout, completePayout, reversePayout, getWalletSummary } from "../service/walletService.js";

const MIN_WITHDRAWAL_USD = 500;


export const getUserWalletSummary = async (req, res) => {
  try {
    const summary = await getWalletSummary(req.user._id);

    return res.status(200).json(summary);
  } catch (error) {
    console.error("Wallet Summary Error:", error);

    return res.status(500).json({
      message: "Error retrieving wallet summary.",
    });
  }
};


export const requestPayout = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user._id;
    const { amountUsd, bankDetails } = req.body;

    const amount = Number(amountUsd);

    if (
      amountUsd === undefined ||
      amountUsd === null ||
      amountUsd === "" ||
      !Number.isFinite(amount) ||
      !Number.isSafeInteger(Math.round(amount * 100)) ||
      amount <= 0
    ) {
      return res.status(400).json({
        message: "Invalid payout amount.",
      });
    }

    if (amount < MIN_WITHDRAWAL_USD) {
      return res.status(400).json({
        message: `Minimum withdrawal amount is $${MIN_WITHDRAWAL_USD}.`,
      });
    }

    if (
      !bankDetails ||
      typeof bankDetails !== "object" ||
      !bankDetails.accountNumber ||
      !bankDetails.bankCode ||
      !bankDetails.accountName
    ) {
      return res.status(400).json({
        message: "Valid bank details are required.",
      });
    }

    let payout;

    await session.withTransaction(async () => {
      // Create the payout request.
      const [createdPayout] = await Payout.create(
        [
          {
            user: userId,
            amountUsd: amount,
            bankDetails,
            status: "pending",
          },
        ],
        { session }
      );

      // Reserve the funds in the same transaction.
      await reservePayout({
        userId,
        payoutId: createdPayout._id,
        session,
      });

      payout = createdPayout;
    });

    return res.status(201).json({
      message:
        "Payout request submitted successfully. We'll contact you via email if there are any issues.",
      payout,
    });
  } catch (error) {
    console.error("Payout Request Error:", error);

    if (error.message === "Insufficient available balance.") {
      return res.status(400).json({
        message: "Insufficient withdrawable balance.",
      });
    }

    return res.status(500).json({
      message: "Failed to request payout.",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

export const payoutHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const payouts = await Payout.find({ user: userId }).skip(skip).limit(limit);
    res.status(200).json({ payouts });
  } catch (error) {
    res.status(500).json({ message: "Failed to get payout history", error: error.message });
  }
};


export const markPayoutCompleted = async (req, res) => {
  try {
    const payout = await completePayout({
      userId: req.params.userId,
      payoutId: req.params.payoutId,
    });

    return res.status(200).json({
      message: "Payout marked as completed.",
      payout,
    });
  } catch (error) {
    console.error("Payout Completion Error:", error);

    return res.status(400).json({
      message: error.message || "Failed to complete payout.",
    });
  }
};

export const reverseFailedPayout = async (req, res) => {
  try {
    const { status, failureReason } = req.body;

    if (!["failed", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be failed or rejected.",
      });
    }

    const payout = await reversePayout({
      userId: req.params.userId,
      payoutId: req.params.payoutId,
      status,
    });

    if (failureReason) {
      payout.failureReason = failureReason;
      await payout.save();
    }

    return res.status(200).json({
      message: `Payout ${status}; funds returned to wallet.`,
      payout,
    });
  } catch (error) {
    console.error("Payout Reversal Error:", error);

    return res.status(400).json({
      message: error.message || "Failed to reverse payout.",
    });
  }
};
