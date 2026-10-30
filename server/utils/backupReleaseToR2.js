
import {
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { s3Client } from "../config/s3.js";
import { r2Client } from "../config/r2.js";

const SOURCE_BUCKET = process.env.AWS_BUCKET_NAME;
const BACKUP_BUCKET = process.env.R2_BUCKET_NAME;

// Compatibility fallback for older releases without artworkKey.
function getKeyFromUrl(url) {
  if (!url) return "";

  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.replace(/^\/+/, ""));
  } catch {
    return "";
  }
}

export async function backupFileToR2(fileKey) {
  if (!SOURCE_BUCKET || !BACKUP_BUCKET) {
    throw new Error(
      "Missing AWS_BUCKET_NAME or R2_BUCKET_NAME environment variable."
    );
  }

  if (!fileKey) {
    throw new Error("Cannot back up a file without its S3 key.");
  }

  const source = await s3Client.send(
    new GetObjectCommand({
      Bucket: SOURCE_BUCKET,
      Key: fileKey,
    })
  );

  if (!source.Body) {
    throw new Error(`S3 returned an empty file body: ${fileKey}`);
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BACKUP_BUCKET,
      Key: fileKey,
      Body: source.Body,
      ...(source.ContentLength != null
        ? { ContentLength: source.ContentLength }
        : {}),
      ContentType:
        source.ContentType || "application/octet-stream",
    })
  );

  return {
    key: fileKey,
    size: source.ContentLength ?? null,
  };
}

export async function backupReleaseToR2(release) {
  const artworkKey =
    release.artworkKey || getKeyFromUrl(release.artwork);

  if (!artworkKey) {
    throw new Error("The release has no usable artwork S3 key.");
  }

  const tracks = release.tracks || [];

  const missingTrackKey = tracks.findIndex(
    (track) => !track.fileKey
  );

  if (missingTrackKey !== -1) {
    throw new Error(
      `Track ${missingTrackKey + 1} is missing its S3 fileKey.`
    );
  }

  // Avoid uploading the same object more than once.
  const fileKeys = [
    ...new Set([
      artworkKey,
      ...tracks.map((track) => track.fileKey),
    ]),
  ];

  // Sequential uploads reduce simultaneous stream and memory usage.
  for (const fileKey of fileKeys) {
    await backupFileToR2(fileKey);
  }

  return {
    status: "copied",
    filesBackedUp: fileKeys.length,
  };
}
