
import BackupJob from "../models/BackupJob.js";

export async function enqueueReleaseBackup(release) {
  const releaseId = release._id;
  const requestedUpdatedAt = release.updatedAt || new Date();
  const now = new Date();

  let job = await BackupJob.findOne({ releaseId });

  if (!job) {
    try {
      return await BackupJob.create({
        releaseId,
        status: "pending",
        requestedUpdatedAt,
        attempts: 0,
        nextAttemptAt: now,
      });
    } catch (error) {
      // Another request may have created the unique job concurrently.
      if (error.code !== 11000) throw error;

      job = await BackupJob.findOne({ releaseId });

      if (!job) throw error;
    }
  }

  job.requestedUpdatedAt = requestedUpdatedAt;

  // If a worker is currently processing this release, leave its
  // lock alone. It will detect the newer version and queue it again.
  if (job.status !== "processing") {
    job.status = "pending";
    job.attempts = 0;
    job.nextAttemptAt = now;
    job.lockedUntil = null;
    job.lockToken = null;
    job.lastError = "";
    job.completedAt = null;
    job.processedUpdatedAt = null;
  }

  await job.save();

  return job;
}
