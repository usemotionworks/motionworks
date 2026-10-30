
import { randomUUID } from "node:crypto";

import Release from "../models/Release.js";
import BackupJob from "../models/BackupJob.js";
import { backupReleaseToR2 } from "../utils/backupReleaseToR2.js";
import { enqueueReleaseBackup } from "../utils/enqueueReleaseBackup.js";

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000;
const LOCK_RENEW_INTERVAL_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 2000;
const RECONCILE_INTERVAL_MS = 60 * 1000;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function errorMessage(error) {
  return String(error?.message || error).slice(0, 1000);
}

/**
 * Claim one job atomically.
 *
 * A fresh token fences off any previous worker that may still be
 * running after its lease expires.
 */
async function claimJob() {
  const now = new Date();
  const lockToken = randomUUID();

  return BackupJob.findOneAndUpdate(
    {
      $or: [
        {
          status: "pending",
          nextAttemptAt: { $lte: now },
        },
        {
          status: "processing",
          $or: [
            { lockedUntil: { $lte: now } },
            { lockedUntil: null },
          ],
        },
      ],
    },
    {
      $set: {
        status: "processing",
        lockToken,
        lockedUntil: new Date(
          now.getTime() + LOCK_DURATION_MS
        ),
      },
      $inc: {
        attempts: 1,
      },
    },
    {
      new: true,
      sort: { nextAttemptAt: 1, createdAt: 1 },
    }
  );
}

/**
 * Extend the lease only while this worker still owns it and
 * the previous lease has not expired.
 */
function startLeaseHeartbeat(job) {
  let stopped = false;
  let lostLease = false;
  let renewalInProgress = false;
  let renewalPromise = Promise.resolve();

  async function renewLease() {
    if (stopped || lostLease || renewalInProgress) {
      return;
    }

    renewalInProgress = true;

    try {
      const now = new Date();

      const result = await BackupJob.updateOne(
        {
          _id: job._id,
          status: "processing",
          lockToken: job.lockToken,
          lockedUntil: { $gt: now },
        },
        {
          $set: {
            lockedUntil: new Date(
              now.getTime() + LOCK_DURATION_MS
            ),
          },
        },
        { timestamps: false }
      );

      if (result.matchedCount !== 1) {
        lostLease = true;

        console.warn(
          `Backup job ${job._id}: lease ownership lost.`
        );
      }
    } catch (error) {
      // A temporary database error doesn't prove the lease was
      // lost. Final writes still verify the token and lease expiry.
      console.error(
        `Could not renew backup job ${job._id} lease:`,
        error.message
      );
    } finally {
      renewalInProgress = false;
    }
  }

  const timer = setInterval(() => {
    renewalPromise = renewLease();
  }, LOCK_RENEW_INTERVAL_MS);

  // Avoid keeping Node alive solely because of this timer.
  timer.unref?.();

  return {
    hasLostLease: () => lostLease,

    async stop() {
      stopped = true;
      clearInterval(timer);
      await renewalPromise;
    },
  };
}

/**
 * Requeue the job if the release changed during the copy.
 * The lock token prevents a stale worker from changing a new
 * worker's job.
 */
async function requeueChangedRelease(job, latestRelease) {
  if (!latestRelease) {
    throw new Error(
      `Release ${job.releaseId} no longer exists.`
    );
  }

  await enqueueReleaseBackup(latestRelease);

  const result = await BackupJob.updateOne(
    {
      _id: job._id,
      status: "processing",
      lockToken: job.lockToken,
      lockedUntil: { $gt: new Date() },
    },
    {
      $set: {
        status: "pending",
        attempts: 0,
        nextAttemptAt: new Date(),
        lockedUntil: null,
        lockToken: null,
        lastError: "",
        completedAt: null,
        processedUpdatedAt: null,
      },
    },
    { timestamps: false }
  );

  if (result.matchedCount !== 1) {
    console.warn(
      `Backup job ${job._id}: could not requeue because ownership changed.`
    );
    return false;
  }

  await Release.updateOne(
    {
      _id: latestRelease._id,
      updatedAt: latestRelease.updatedAt,
    },
    {
      $set: {
        backupStatus: "pending",
        backupSyncedAt: null,
        backupError: "",
      },
    },
    { timestamps: false }
  );

  console.log(
    `Release ${latestRelease._id} changed during backup; queued its latest version.`
  );

  return true;
}

async function processOneJob() {
  const job = await claimJob();

  if (!job) return false;

  const jobId = job._id;
  const releaseId = job.releaseId;
  const lockToken = job.lockToken;
  const claimedVersion =
    job.requestedUpdatedAt?.getTime() ?? 0;

  const lease = startLeaseHeartbeat(job);

  let sourceRelease = null;

  try {
    sourceRelease = await Release.findById(releaseId);

    if (!sourceRelease) {
      throw new Error(
        `Release ${releaseId} no longer exists.`
      );
    }

    if (sourceRelease.status === "draft") {
      throw new Error("Draft releases cannot be backed up.");
    }

    const sourceVersion =
      sourceRelease.updatedAt?.getTime() ?? 0;

    // Copy files while the heartbeat maintains the lease.
    const copyResult = await backupReleaseToR2(sourceRelease);

    await lease.stop();

    // Never finalize a job after losing ownership.
    if (lease.hasLostLease()) {
      console.warn(
        `Backup job ${jobId}: copy finished, but this worker no longer owns the lease.`
      );
      return true;
    }

    const [latestRelease, latestJob] = await Promise.all([
      Release.findById(releaseId)
        .select("_id status updatedAt")
        .lean(),

      BackupJob.findById(jobId)
        .select("requestedUpdatedAt status lockToken lockedUntil")
        .lean(),
    ]);

    if (!latestRelease || !latestJob) {
      throw new Error(
        "Release or backup job disappeared during processing."
      );
    }

    // The token may have changed while the copy was finishing.
    if (
      latestJob.status !== "processing" ||
      latestJob.lockToken !== lockToken ||
      !latestJob.lockedUntil ||
      latestJob.lockedUntil <= new Date()
    ) {
      console.warn(
        `Backup job ${jobId}: ownership changed before finalization.`
      );
      return true;
    }

    const latestReleaseVersion =
      latestRelease.updatedAt?.getTime() ?? 0;

    const latestRequestedVersion =
      latestJob.requestedUpdatedAt?.getTime() ?? 0;

    const releaseChanged =
      latestReleaseVersion > sourceVersion ||
      latestRequestedVersion > claimedVersion;

    if (releaseChanged) {
      await requeueChangedRelease(job, latestRelease);
      return true;
    }

    /*
     * Complete the queue job first, conditionally. A newer enqueue
     * updates requestedUpdatedAt; if it races with this write, the
     * version filter prevents this worker from completing that newer
     * request.
     *
     * processedUpdatedAt remains null until the release metadata
     * update succeeds, so reconciliation can recover an interruption.
     */
    const completion = await BackupJob.updateOne(
      {
        _id: jobId,
        status: "processing",
        lockToken,
        lockedUntil: { $gt: new Date() },
        requestedUpdatedAt: { $lte: job.requestedUpdatedAt },
      },
      {
        $set: {
          status: "completed",
          processedUpdatedAt: null,
          lockedUntil: null,
          lockToken: null,
          lastError: "",
          completedAt: new Date(),
        },
      },
      { timestamps: false }
    );

    if (completion.matchedCount !== 1) {
      // A new revision may have arrived between the previous read
      // and the completion write. Never overwrite a new owner's job.
      const currentRelease = await Release.findById(releaseId)
        .select("_id status updatedAt")
        .lean();

      if (currentRelease) {
        await enqueueReleaseBackup(currentRelease);

        // This only works if the current worker still owns the job.
        await BackupJob.updateOne(
          {
            _id: jobId,
            status: "processing",
            lockToken,
            lockedUntil: { $gt: new Date() },
          },
          {
            $set: {
              status: "pending",
              attempts: 0,
              nextAttemptAt: new Date(),
              lockedUntil: null,
              lockToken: null,
              lastError: "",
              completedAt: null,
              processedUpdatedAt: null,
            },
          },
          { timestamps: false }
        );

        await Release.updateOne(
          {
            _id: releaseId,
            updatedAt: currentRelease.updatedAt,
          },
          {
            $set: {
              backupStatus: "pending",
              backupSyncedAt: null,
              backupError: "",
            },
          },
          { timestamps: false }
        );
      }

      return true;
    }

    // Only mark this exact release version as synced.
    const syncedAt = new Date();

    const releaseUpdate = await Release.updateOne(
      {
        _id: releaseId,
        updatedAt: sourceRelease.updatedAt,
      },
      {
        $set: {
          backupStatus: "synced",
          backupSyncedAt: syncedAt,
          backupError: "",
        },
      },
      { timestamps: false }
    );

    if (releaseUpdate.matchedCount !== 1) {
      // The release changed after our version check.
      const currentRelease = await Release.findById(releaseId)
        .select("_id status updatedAt")
        .lean();

      if (currentRelease) {
        await enqueueReleaseBackup(currentRelease);
      }

      await Release.updateOne(
        {
          _id: releaseId,
          ...(currentRelease
            ? { updatedAt: currentRelease.updatedAt }
            : {}),
        },
        {
          $set: {
            backupStatus: "pending",
            backupSyncedAt: null,
            backupError: "",
          },
        },
        { timestamps: false }
      );

      console.log(
        `Release ${releaseId} changed during finalization; a fresh backup is queued.`
      );

      return true;
    }

    // Mark the completed job as having processed this exact version.
    // If it was requeued in the meantime, this conditional update
    // won't overwrite that newer request.
    await BackupJob.updateOne(
      {
        _id: jobId,
        status: "completed",
        completedAt: { $ne: null },
        requestedUpdatedAt: { $lte: job.requestedUpdatedAt },
      },
      {
        $set: {
          processedUpdatedAt: sourceRelease.updatedAt,
        },
      },
      { timestamps: false }
    );

    console.log(
      `Backup job ${jobId} completed for release ${releaseId}; ` +
      `${copyResult.filesBackedUp} files copied.`
    );
  } catch (error) {
    console.error(
      `Backup job ${jobId} failed:`,
      errorMessage(error)
    );

    await lease.stop();

    // A worker that lost its lease must not write failure state.
    if (lease.hasLostLease()) {
      console.warn(
        `Backup job ${jobId}: skipping failure update because lease ownership was lost.`
      );
      return true;
    }

    const attempts = job.attempts;
    const exhausted = attempts >= MAX_ATTEMPTS;

    const retryDelayMs = Math.min(
      5000 * 2 ** Math.max(attempts - 1, 0),
      5 * 60 * 1000
    );

    const failure = await BackupJob.updateOne(
      {
        _id: jobId,
        status: "processing",
        lockToken,
        lockedUntil: { $gt: new Date() },
      },
      {
        $set: {
          status: exhausted ? "failed" : "pending",
          nextAttemptAt: new Date(Date.now() + retryDelayMs),
          lockedUntil: null,
          lockToken: null,
          lastError: errorMessage(error),
        },
      },
      { timestamps: false }
    );

    // Only the worker that successfully transitions its job may
    // update the corresponding release's failure metadata.
    if (failure.matchedCount === 1) {
      await Release.updateOne(
        { _id: releaseId },
        {
          $set: {
            backupStatus: exhausted ? "failed" : "pending",
            backupSyncedAt: null,
            backupError: errorMessage(error),
          },
        },
        { timestamps: false }
      );
    } else {
      console.warn(
        `Backup job ${jobId}: failure state not changed because ownership expired or changed.`
      );
    }
  }

  return true;
}

async function reconcileMissingJobs() {
  const releases = await Release.find({
    status: { $in: ["pending", "distributed"] },
    backupStatus: "pending",
  })
    .select("_id updatedAt status backupStatus")
    .limit(100)
    .lean();

  for (const release of releases) {
    try {
      const job = await BackupJob.findOne({
        releaseId: release._id,
      }).lean();

      if (
        !job ||
        job.status === "failed" ||
        (
          job.status === "completed" &&
          (
            !job.processedUpdatedAt ||
            release.updatedAt > job.processedUpdatedAt
          )
        )
      ) {
        await enqueueReleaseBackup(release);
      }
    } catch (error) {
      console.error(
        `Could not reconcile release ${release._id}:`,
        error.message
      );
    }
  }
}

let started = false;

export function startReleaseBackupProcessor({ concurrency = 2 } = {}) {
  if (started) return;
  started = true;

  async function workerLoop() {
    while (true) {
      try {
        const processed = await processOneJob();

        if (!processed) {
          await sleep(POLL_INTERVAL_MS);
        }
      } catch (error) {
        console.error("Backup processor error:", error);
        await sleep(POLL_INTERVAL_MS);
      }
    }
  }

  for (let i = 0; i < concurrency; i += 1) {
    void workerLoop();
  }

  async function reconcileLoop() {
    while (true) {
      await sleep(RECONCILE_INTERVAL_MS);

      try {
        await reconcileMissingJobs();
      } catch (error) {
        console.error("Backup reconciliation error:", error);
      }
    }
  }

  void reconcileLoop();

  console.log(
    `MongoDB backup processor started with concurrency ${concurrency}.`
  );
}
