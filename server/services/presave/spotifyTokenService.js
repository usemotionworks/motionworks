
import PreSaveAuthorization from "../../models/PreSaveAuthorization.js";

import {
  encryptPreSaveToken,
  decryptPreSaveToken,
} from "../../utils/preSaveTokenEncryption.js";

const SPOTIFY_TOKEN_URL =
  "https://accounts.spotify.com/api/token";

const ACCESS_TOKEN_BUFFER_MS = 60 * 1000;

// Prevent simultaneous refresh requests for the same guest/provider
// within this Node.js process.
const refreshPromises = new Map();

const getEncryptionContext = (guestId) => {
  return `presave:spotify:${guestId}`;
};

const createReauthorizationError = () => {
  const error = new Error(
    "Spotify authorization must be renewed."
  );

  error.code = "SPOTIFY_REAUTHORIZATION_REQUIRED";

  return error;
};

const decryptAccessToken = (authorization) => {
  return decryptPreSaveToken(
    authorization.accessTokenEncrypted,
    getEncryptionContext(authorization.guestId)
  );
};

const refreshSpotifyToken = async (authorization) => {
  const guestId = authorization.guestId;

  if (!authorization.refreshTokenEncrypted) {
    await PreSaveAuthorization.updateOne(
      { _id: authorization._id },
      {
        $set: {
          status: "reauthorization_required",
        },
      }
    );

    throw createReauthorizationError();
  }

  const encryptionContext = getEncryptionContext(guestId);

  const refreshToken = decryptPreSaveToken(
    authorization.refreshTokenEncrypted,
    encryptionContext
  );

  const clientId = process.env.SPOTIFY_CLIENT_ID;

  if (!clientId) {
    throw new Error("SPOTIFY_CLIENT_ID is not configured.");
  }

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });

  let tokenData;

  try {
    tokenData = await response.json();
  } catch {
    throw new Error("Spotify returned an invalid token response.");
  }

  if (!response.ok) {
    if (tokenData.error === "invalid_grant") {
      // Spotify no longer accepts this refresh token.
      // The fan must authorize again.
      await PreSaveAuthorization.updateOne(
        { _id: authorization._id },
        {
          $set: {
            status: "reauthorization_required",
            refreshTokenEncrypted: null,
          },
        }
      );

      throw createReauthorizationError();
    }

    // Do not mark the authorization as failed for temporary
    // network, rate-limit, or Spotify server errors.
    const error = new Error("Spotify token refresh failed.");

    error.code = "SPOTIFY_TOKEN_REFRESH_FAILED";
    error.status = response.status;

    throw error;
  }

  if (
    typeof tokenData.access_token !== "string" ||
    !tokenData.access_token ||
    !Number.isFinite(Number(tokenData.expires_in))
  ) {
    throw new Error("Spotify returned an invalid refreshed token.");
  }

  const updateFields = {
    accessTokenEncrypted: encryptPreSaveToken(
      tokenData.access_token,
      encryptionContext
    ),

    tokenExpiresAt: new Date(
      Date.now() + Number(tokenData.expires_in) * 1000
    ),

    status: "active",
    lastRefreshedAt: new Date(),
  };

  // Spotify does not always return a new refresh token.
  // Keep the existing encrypted token unless a replacement is supplied.
  if (
    typeof tokenData.refresh_token === "string" &&
    tokenData.refresh_token
  ) {
    updateFields.refreshTokenEncrypted = encryptPreSaveToken(
      tokenData.refresh_token,
      encryptionContext
    );
  }

  if (typeof tokenData.scope === "string") {
    updateFields.scopes = tokenData.scope
      .split(" ")
      .filter(Boolean);
  }

  if (typeof tokenData.token_type === "string") {
    updateFields.tokenType = tokenData.token_type;
  }

  await PreSaveAuthorization.updateOne(
    { _id: authorization._id },
    {
      $set: updateFields,
    }
  );

  return tokenData.access_token;
};

/**
 * Returns a usable Spotify access token for a guest.
 *
 * Refreshes the token automatically when it is expired
 * or close to expiry.
 */
export const getSpotifyAccessToken = async (guestId) => {
  if (!guestId) {
    throw new Error("Guest session is required.");
  }

  const authorization = await PreSaveAuthorization.findOne({
    guestId,
    provider: "spotify",
  }).select(
    "+accessTokenEncrypted +refreshTokenEncrypted"
  );

  if (!authorization) {
    throw createReauthorizationError();
  }

  if (
    authorization.status === "revoked" ||
    authorization.status === "reauthorization_required" ||
    authorization.status === "failed"
  ) {
    throw createReauthorizationError();
  }

  const now = Date.now();

  const tokenIsValid =
    authorization.status === "active" &&
    authorization.tokenExpiresAt &&
    authorization.tokenExpiresAt.getTime() >
      now + ACCESS_TOKEN_BUFFER_MS;

  if (tokenIsValid) {
    return decryptAccessToken(authorization);
  }

  // Avoid refreshing the same guest's token multiple times
  // concurrently within this process.
  const refreshKey = `${guestId}:spotify`;

  if (!refreshPromises.has(refreshKey)) {
    const refreshPromise = refreshSpotifyToken(authorization)
      .finally(() => {
        refreshPromises.delete(refreshKey);
      });

    refreshPromises.set(refreshKey, refreshPromise);
  }

  return refreshPromises.get(refreshKey);
};
