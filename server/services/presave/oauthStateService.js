import crypto from "crypto";

import PreSaveOAuthState from "../../models/PreSaveOAuthState.js";

import {
  encryptPreSaveToken,
  decryptPreSaveToken,
} from "../../utils/preSaveTokenEncryption.js";

const STATE_EXPIRY_MINUTES = 10;

const SUPPORTED_PROVIDERS = [
  "spotify",
  "appleMusic",
  "deezer",
  "youtubeMusic",
  "tidal",
];

const hashState = (state) => {
  return crypto
    .createHash("sha256")
    .update(state)
    .digest("hex");
};

const generatePKCE = () => {
  const verifier = crypto.randomBytes(64).toString("base64url");

  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");

  return {
    verifier,
    challenge,
  };
};

const getEncryptionContext = (provider, stateHash) => {
  return `presave-oauth-state:${provider}:${stateHash}`;
};

export const createOAuthState = async ({
  guestId,
  provider,
  campaignSlug = null,
}) => {
  if (!guestId) {
    throw new Error("Guest session is required");
  }

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw new Error("Unsupported OAuth provider");
  }

  if (
    campaignSlug !== null &&
    (
      typeof campaignSlug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(campaignSlug)
    )
  ) {
    throw new Error("Invalid campaign slug");
  }

  // Raw state is sent to Spotify.
  // Only its SHA-256 hash is stored in MongoDB.
  const state = crypto.randomBytes(32).toString("hex");

  const stateHash = hashState(state);

  const { verifier, challenge } = generatePKCE();

  const codeVerifierEncrypted = encryptPreSaveToken(
    verifier,
    getEncryptionContext(provider, stateHash)
  );

  const expiresAt = new Date(
    Date.now() + STATE_EXPIRY_MINUTES * 60 * 1000
  );

  await PreSaveOAuthState.create({
    stateHash,
    guestId,
    provider,
    codeVerifierEncrypted,
    campaignSlug,
    expiresAt,
  });

  return {
    state,
    codeChallenge: challenge,
    expiresAt,
  };
};

export const consumeOAuthState = async ({
  state,
  guestId,
  provider,
}) => {
  if (
    typeof state !== "string" ||
    !/^[a-f0-9]{64}$/.test(state) ||
    !guestId ||
    !SUPPORTED_PROVIDERS.includes(provider)
  ) {
    return null;
  }

  const stateHash = hashState(state);

  // Atomic find-and-delete ensures a state can only be consumed once.
  // It must also belong to the same guest and must not be expired.
  const stateRecord = await PreSaveOAuthState.findOneAndDelete({
    stateHash,
    guestId,
    provider,
    expiresAt: { $gt: new Date() },
  }).select("+codeVerifierEncrypted");

  if (!stateRecord) {
    return null;
  }

  const codeVerifier = decryptPreSaveToken(
    stateRecord.codeVerifierEncrypted,
    getEncryptionContext(provider, stateHash)
  );

  return {
    guestId: stateRecord.guestId,
    provider: stateRecord.provider,
    codeVerifier,
    campaignSlug: stateRecord.campaignSlug,
  };
};
