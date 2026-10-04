
import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "../models/User.js";
import Report from "../models/Report.js";
import Release from "../models/Release.js";
import Payout from "../models/Payout.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";

dotenv.config();

const ARTIST_SHARE = 0.80;
const DRY_RUN = process.argv.includes("--dry-run");

const toCents = (amount) =>
  Math.round((Number(amount) + Number.EPSILON) * 100);

const fromCents = (cents) => cents / 100;

async function buildPlan() {
  const releases = await Release.find({})
    .select("_id releaseOwner")
    .lean();

  const ownerByRelease = new Map(
    releases.map((release) => [
      String(release._id),
      release.releaseOwner,
    ])
  );

  const releaseIds = releases.map((release) => release._id);

  const reports = releaseIds.length
    ? await Report.find({
        releaseId: { $in: releaseIds },
        status: "submitted",
      })
        .sort({
          reportMonth: -1,
          updatedAt: -1,
          createdAt: -1,
          _id: -1,
        })
        .lean()
    : [];

  // Select only the latest submitted report per release.
  const latestByRelease = new Map();

  for (const report of reports) {
    const releaseId = String(report.releaseId);

    if (!latestByRelease.has(releaseId)) {
      latestByRelease.set(releaseId, report);
    }
  }

  const userPlans = new Map();

  for (const [releaseId, report] of latestByRelease) {
    const ownerId = ownerByRelease.get(releaseId);

    if (!ownerId) {
      throw new Error(
        `No owner found for release ${releaseId}`
      );
    }

    const grossCents = toCents(report.totalRevenueUsd ?? 0);

    if (!Number.isSafeInteger(grossCents) || grossCents < 0) {
      throw new Error(`Invalid revenue in report ${report._id}`);
    }

    const netCents = Math.round(grossCents * ARTIST_SHARE);
    const userId = String(ownerId);

    if (!userPlans.has(userId)) {
      userPlans.set(userId, {
        userId: ownerId,
        releases: [],
        totalGrossCents: 0,
        totalFeeCents: 0,
        totalNetCents: 0,
      });
    }

    const plan = userPlans.get(userId);

    plan.releases.push({
      releaseId: report.releaseId,
      reportId: report._id,
      reportMonth: report.reportMonth,
      grossCents,
      feeCents: grossCents - netCents,
      netCents,
    });

    plan.totalGrossCents += grossCents;
    plan.totalFeeCents += grossCents - netCents;
    plan.totalNetCents += netCents;
  }

  return [...userPlans.values()];
}

async function migrateUser(plan) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const user = await User.findById(plan.userId)
        .session(session);

      if (!user) {
        throw new Error(`User not found: ${plan.userId}`);
      }

      // Do not migrate users with existing payout history.
      const existingPayout = await Payout.findOne({
        user: plan.userId,
      }).session(session);

      if (existingPayout) {
        throw new Error(
          `User ${plan.userId} has payout history. ` +
          "Manual reconciliation is required."
        );
      }

      const existingTransactions =
        await WalletTransaction.findOne({
          user: plan.userId,
        }).session(session);

      if (existingTransactions) {
        throw new Error(
          `User ${plan.userId} already has wallet transactions. ` +
          "Migration stopped to prevent duplicate credits."
        );
      }

      let wallet = await Wallet.findOne({
        user: plan.userId,
      }).session(session);

      if (wallet) {
        // Only initialize a genuinely empty wallet.
        if (
          toCents(wallet.balanceUsd) !== 0 ||
          toCents(wallet.totalEarnedUsd) !== 0 ||
          toCents(wallet.totalWithdrawnUsd) !== 0
        ) {
          throw new Error(
            `User ${plan.userId} already has a non-empty wallet. ` +
            "Manual reconciliation is required."
          );
        }
      } else {
        [wallet] = await Wallet.create(
          [{ user: plan.userId, currency: "USD" }],
          { session }
        );
      }

      let runningBalanceCents = 0;

      // One opening earning transaction per release.
      for (const item of plan.releases) {
        if (item.netCents === 0) continue;

        const beforeCents = runningBalanceCents;
        runningBalanceCents += item.netCents;

        await WalletTransaction.create(
          [
            {
              wallet: wallet._id,
              user: plan.userId,
              type: "earning",
              amountUsd: fromCents(item.netCents),
              balanceBeforeUsd: fromCents(beforeCents),
              balanceAfterUsd: fromCents(runningBalanceCents),
              referenceType: "report",
              referenceId: item.reportId,
              description:
                `Initial wallet migration: latest report for ${item.reportMonth}`,
            },
          ],
          { session }
        );
      }

      wallet.balanceUsd = fromCents(plan.totalNetCents);
      wallet.totalEarnedUsd = fromCents(plan.totalNetCents);
      wallet.totalWithdrawnUsd = 0;

      await wallet.save({ session });

      if (runningBalanceCents !== plan.totalNetCents) {
        throw new Error(
          `Ledger mismatch for user ${plan.userId}`
        );
      }
    });

    console.log(
      `Migrated ${plan.userId}: $${fromCents(plan.totalNetCents).toFixed(2)}`
    );
  } finally {
    await session.endSession();
  }
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  try {
    const plans = await buildPlan();

    if (plans.length === 0) {
      console.log("No submitted reports found.");
      return;
    }

    console.log(
      DRY_RUN ? "\nDRY RUN — no changes will be made\n" : "\nMIGRATION\n"
    );

    for (const plan of plans) {
      const user = await User.findById(plan.userId)
        .select("email username")
        .lean();

      console.log({
        userId: String(plan.userId),
        email: user?.email,
        releases: plan.releases.length,
        grossRevenueUsd: fromCents(plan.totalGrossCents),
        platformFeeUsd: fromCents(plan.totalFeeCents),
        artistEarningsUsd: fromCents(plan.totalNetCents),
      });
    }

    if (DRY_RUN) {
      console.log("\nDry run complete. No data was changed.");
      return;
    }

    for (const plan of plans) {
      await migrateUser(plan);
    }

    console.log("\nMigration completed successfully.");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("\nMigration failed:", error);
  process.exitCode = 1;
});
