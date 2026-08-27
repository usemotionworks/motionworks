import Report from "../models/Report.js";
import Release from "../models/Release.js";
import Payout from "../models/Payout.js";

export const getUserWalletSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get user releases
    const userReleases = await Release.find({ releaseOwner: userId }).select("_id");
    const releaseIds = userReleases.map((r) => r._id);

    // 2. Aggregate gross catalog revenue
    const revenueAgg = await Report.aggregate([
      { $match: { releaseId: { $in: releaseIds } } },
      { $group: { _id: null, gross: { $sum: "$totalRevenueUsd" } } },
    ]);

    const grossRevenueUsd = revenueAgg[0]?.gross || 0;
    const platformFeeUsd = grossRevenueUsd * 0.20;
    const netPayoutUsd = grossRevenueUsd * 0.80; // Total 80% earned life-to-date

    // 3. Aggregate all non-failed payouts (pending + processing + completed)
    const payoutAgg = await Payout.aggregate([
      {
        $match: {
          user: userId,
          status: { $in: ["pending", "processing", "completed"] },
        },
      },
      { $group: { _id: null, totalWithdrawn: { $sum: "$amountUsd" } } },
    ]);

    const totalWithdrawnUsd = payoutAgg[0]?.totalWithdrawn || 0;

    // 4. Calculate current available balance
    const availableBalanceUsd = Math.max(0, netPayoutUsd - totalWithdrawnUsd);

    res.status(200).json({
      grossRevenueUsd,
      platformFeeUsd,
      netPayoutUsd,
      totalWithdrawnUsd,
      availableBalanceUsd,
    });
  } catch (error) {
    res.status(500).json({ message: "Error calculating wallet summary", error: error.message });
  }
};

export const requestPayout = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amountUsd, bankDetails } = req.body;

    if (!amountUsd || amountUsd <= 0) {
      return res.status(400).json({ message: "Invalid payout amount" });
    }

    // 1. Calculate current available balance on backend
    const userReleases = await Release.find({ releaseOwner: userId }).select("_id");
    const releaseIds = userReleases.map((r) => r._id);

    const revenueAgg = await Report.aggregate([
      { $match: { releaseId: { $in: releaseIds } } },
      { $group: { _id: null, gross: { $sum: "$totalRevenueUsd" } } },
    ]);

    const gross = revenueAgg[0]?.gross || 0;
    const netEarnings = gross * 0.80;

    const payoutAgg = await Payout.aggregate([
      {
        $match: {
          user: userId,
          status: { $in: ["pending", "processing", "completed"] },
        },
      },
      { $group: { _id: null, totalWithdrawn: { $sum: "$amountUsd" } } },
    ]);

    const totalWithdrawn = payoutAgg[0]?.totalWithdrawn || 0;
    const availableBalance = netEarnings - totalWithdrawn;

    // 2. Prevent over-withdrawal
    if (amountUsd > availableBalance) {
      return res.status(400).json({ message: "Insufficient withdrawable balance" });
    }

    const MIN_WITHDRAWAL_USD = 100;
    if (!amountUsd || amountUsd < MIN_WITHDRAWAL_USD) {
      return res.status(400).json({ message: `Minimum withdrawal amount is $${MIN_WITHDRAWAL_USD}` });
    }

    // 3. Create Payout Request
    const payout = await Payout.create({
      user: userId,
      amountUsd,
      bankDetails,
      status: "pending",
    });

    res.status(201).json({ message: "Payout request submitted successfully, We'll contact you via email if there are any issues", payout });
  } catch (error) {
    res.status(500).json({ message: "Failed to request payout", error: error.message });
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
