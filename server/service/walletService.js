
import mongoose from "mongoose";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import Payout from "../models/Payout.js";
import Release from "../models/Release.js";
import Report from "../models/Report.js";

const PLATFORM_FEE_RATE = 0.20;

// Round USD values to two decimal places.
const toCents = (amount) => Math.round((Number(amount) + Number.EPSILON) * 100);
const fromCents = (cents) => cents / 100;

const startSession = () => mongoose.startSession();

/**
 * Get an existing wallet or create one.
 */
export const getOrCreateWallet = async (userId, session = null) => {
  const options = session ? { session } : {};

  let wallet = await Wallet.findOne({ user: userId }, null, options);

  if (!wallet) {
    try {
      wallet = await Wallet.create(
        [{ user: userId }],
        options
      );
      wallet = wallet[0];
    } catch (error) {
      // Another request may have created the wallet concurrently.
      if (error.code !== 11000) throw error;

      wallet = await Wallet.findOne({ user: userId }, null, options);
      if (!wallet) throw error;
    }
  }

  return wallet;
};

/**
 * Synchronize a report's earnings with the wallet.
 *
 * Call this after saving the report.
 * Draft reports have a target credit of zero.
 *
 * Repeated calls with the same report amount do not
 * create duplicate credits.
 */


/**
 * Recalculate a user's earnings using the latest submitted
 * report for each release.
 *
 * Must be called inside the report-saving transaction.
 * The wallet is adjusted only by the difference between
 * its existing total earnings and the new calculated total.
 */
export const syncReportEarnings = async ({
  userId,
  reportId,
  session,
}) => {
  if (!session) {
    throw new Error("A MongoDB session is required.");
  }

  const wallet = await getOrCreateWallet(userId, session);

  // Find all releases belonging to this user.
  const releases = await Release.find({
    releaseOwner: userId,
  })
    .select("_id")
    .session(session)
    .lean();

  const releaseIds = releases.map((release) => release._id);

  // No releases means no report-based earnings.
  let latestReports = [];

  if (releaseIds.length > 0) {
    const reports = await Report.find({
      releaseId: { $in: releaseIds },
      status: "submitted",
    })
      .sort({
        reportMonth: -1,
        updatedAt: -1,
        createdAt: -1,
        _id: -1,
      })
      .session(session)
      .lean();

    // Keep only the latest submitted report per release.
    const latestByRelease = new Map();

    for (const report of reports) {
      const releaseId = String(report.releaseId);

      if (!latestByRelease.has(releaseId)) {
        latestByRelease.set(releaseId, report);
      }
    }

    latestReports = [...latestByRelease.values()];
  }

  // Calculate the current total artist earnings.
  const targetNetCents = latestReports.reduce((sum, report) => {
    const grossCents = toCents(report.totalRevenueUsd ?? 0);

    if (!Number.isSafeInteger(grossCents) || grossCents < 0) {
      throw new Error(
        `Invalid revenue in report ${report._id}.`
      );
    }

    return sum + Math.round(grossCents * (1 - PLATFORM_FEE_RATE));
  }, 0);

  const currentEarnedCents = toCents(wallet.totalEarnedUsd);
  const differenceCents = targetNetCents - currentEarnedCents;

  // Nothing has changed.
  if (differenceCents === 0) {
    return wallet;
  }

  const balanceBeforeCents = toCents(wallet.balanceUsd);
  const balanceAfterCents = balanceBeforeCents + differenceCents;

  if (balanceAfterCents < 0) {
    throw new Error(
      "This report correction would reduce earnings below the " +
      "available wallet balance. Manual reconciliation is required."
    );
  }

  wallet.balanceUsd = fromCents(balanceAfterCents);
  wallet.totalEarnedUsd = fromCents(targetNetCents);

  await wallet.save({ session });

  // Use the report that triggered this recalculation as the
  // transaction reference, while recording the actual difference.
  const triggeringReport = await Report.findById(reportId)
    .select("_id")
    .session(session)
    .lean();

  if (!triggeringReport) {
    throw new Error("Report not found for wallet adjustment.");
  }

  await WalletTransaction.create(
    [
      {
        wallet: wallet._id,
        user: userId,
        type: differenceCents > 0
          ? "earning_adjustment"
          : "earning_adjustment",
        amountUsd: fromCents(differenceCents),
        balanceBeforeUsd: fromCents(balanceBeforeCents),
        balanceAfterUsd: fromCents(balanceAfterCents),
        referenceType: "report",
        referenceId: triggeringReport._id,
        description:
          "Wallet recalculated from the latest submitted report " +
          "for each release",
      },
    ],
    { session }
  );

  return wallet;
};
/**
 * Reserve funds when a payout is requested.
 *
 * The amount is deducted immediately so it cannot
 * be spent in another payout request.
 */

export const reservePayout = async ({
  userId,
  payoutId,
  session,
}) => {
  if (!session) {
    throw new Error("A MongoDB session is required.");
  }

  const payout = await Payout.findOne(
    { _id: payoutId, user: userId },
    null,
    { session }
  );

  if (!payout) {
    throw new Error("Payout not found.");
  }

  if (payout.status !== "pending") {
    throw new Error("Only pending payouts can be reserved.");
  }

  const existing = await WalletTransaction.findOne(
    {
      referenceType: "payout",
      referenceId: payout._id,
      type: "payout",
    },
    null,
    { session }
  );

  if (existing) {
    throw new Error("Payout funds have already been reserved.");
  }

  const wallet = await getOrCreateWallet(userId, session);

  const amountCents = toCents(payout.amountUsd);
  const balanceBeforeCents = toCents(wallet.balanceUsd);

  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error("Invalid payout amount.");
  }

  if (amountCents > balanceBeforeCents) {
    throw new Error("Insufficient available balance.");
  }

  const balanceAfterCents = balanceBeforeCents - amountCents;

  wallet.balanceUsd = fromCents(balanceAfterCents);
  await wallet.save({ session });

  const [transaction] = await WalletTransaction.create(
    [
      {
        wallet: wallet._id,
        user: userId,
        type: "payout",
        amountUsd: fromCents(-amountCents),
        balanceBeforeUsd: fromCents(balanceBeforeCents),
        balanceAfterUsd: fromCents(balanceAfterCents),
        referenceType: "payout",
        referenceId: payout._id,
        description: "Payout funds reserved",
      },
    ],
    { session }
  );

  return transaction;
};

/**
 * Finalize a completed payout.
 *
 * Funds have already been deducted when reserved.
 * Only update the lifetime withdrawal total here.
 */
export const completePayout = async ({ userId, payoutId }) => {
  const session = await startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const payout = await Payout.findOne(
        { _id: payoutId, user: userId },
        null,
        { session }
      );

      if (!payout) throw new Error("Payout not found.");

      if (payout.status === "completed") {
        result = payout;
        return;
      }

      if (!["pending", "processing"].includes(payout.status)) {
        throw new Error("Payout cannot be completed in its current state.");
      }

      const reservation = await WalletTransaction.findOne(
        {
          referenceType: "payout",
          referenceId: payout._id,
          type: "payout",
        },
        null,
        { session }
      );

      if (!reservation) {
        throw new Error("Payout has no wallet reservation.");
      }

      const wallet = await getOrCreateWallet(userId, session);

      wallet.totalWithdrawnUsd = fromCents(
        toCents(wallet.totalWithdrawnUsd) +
          toCents(payout.amountUsd)
      );

      payout.status = "completed";
      payout.processedAt = new Date();

      await wallet.save({ session });
      await payout.save({ session });

      result = payout;
    });

    return result;
  } finally {
    await session.endSession();
  }
};

/**
 * Release reserved funds when a payout fails or is rejected.
 */
export const reversePayout = async ({
  userId,
  payoutId,
  status = "failed",
}) => {
  if (!["failed", "rejected"].includes(status)) {
    throw new Error("Invalid reversal status.");
  }

  const session = await startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const payout = await Payout.findOne(
        { _id: payoutId, user: userId },
        null,
        { session }
      );

      if (!payout) throw new Error("Payout not found.");

      if (["failed", "rejected"].includes(payout.status)) {
        result = payout;
        return;
      }

      if (!["pending", "processing"].includes(payout.status)) {
        throw new Error("Payout cannot be reversed in its current state.");
      }

      const reservation = await WalletTransaction.findOne(
        {
          referenceType: "payout",
          referenceId: payout._id,
          type: "payout",
        },
        null,
        { session }
      );

      if (!reservation) {
        throw new Error("Payout has no wallet reservation.");
      }

      const existingReversal = await WalletTransaction.findOne(
        {
          referenceType: "payout",
          referenceId: payout._id,
          type: "payout_reversal",
        },
        null,
        { session }
      );

      if (existingReversal) {
        throw new Error("Payout has already been reversed.");
      }

      const wallet = await getOrCreateWallet(userId, session);
      const balanceBeforeCents = toCents(wallet.balanceUsd);
      const amountCents = toCents(payout.amountUsd);
      const balanceAfterCents = balanceBeforeCents + amountCents;

      wallet.balanceUsd = fromCents(balanceAfterCents);

      payout.status = status;

      await wallet.save({ session });
      await payout.save({ session });

      await WalletTransaction.create(
        [
          {
            wallet: wallet._id,
            user: userId,
            type: "payout_reversal",
            amountUsd: fromCents(amountCents),
            balanceBeforeUsd: fromCents(balanceBeforeCents),
            balanceAfterUsd: fromCents(balanceAfterCents),
            referenceType: "payout",
            referenceId: payout._id,
            description: `Payout ${status}; reserved funds released`,
          },
        ],
        { session }
      );

      result = payout;
    });

    return result;
  } finally {
    await session.endSession();
  }
};


export const getWalletSummary = async (userId) => {
  const wallet = await getOrCreateWallet(userId);

  const releases = await Release.find({
    releaseOwner: userId,
  })
    .select("_id")
    .lean();


  const releaseIds = releases.map((release) => release._id);

  let grossCents = 0;

  if (releaseIds.length > 0) {
    const reports = await Report.find({
      releaseId: { $in: releaseIds },
      status: "distributed",
    })
      .sort({
        reportMonth: -1,
        updatedAt: -1,
        createdAt: -1,
        _id: -1,
      })
      .lean();

    const latestByRelease = new Map();

    for (const report of reports) {
      const id = String(report.releaseId);

      if (!latestByRelease.has(id)) {
        latestByRelease.set(id, report);
      }
    }

    for (const report of latestByRelease.values()) {
      grossCents += toCents(report.totalRevenueUsd ?? 0);
    }
  }

  const netCents = Math.round(grossCents * 0.80);
  const feeCents = grossCents - netCents;

  return {
    currency: "USD",
    grossRevenueUsd: fromCents(grossCents),
    platformFeeUsd: fromCents(feeCents),
    artistSharePercentage: 80,
    platformFeePercentage: 20,
    netPayoutUsd: fromCents(netCents),
    totalWithdrawnUsd: wallet.totalWithdrawnUsd,
    availableBalanceUsd: wallet.balanceUsd,
    pendingWithdrawalUsd: Math.max(
      0,
      fromCents(netCents) -
        wallet.balanceUsd -
        wallet.totalWithdrawnUsd
    ),
  };
};
