import {
  createOAuthState,
  consumeOAuthState,
} from "../services/presave/oauthStateService.js";

import PreSaveAuthorization from "../models/PreSaveAuthorization.js";

import {
  encryptPreSaveToken,
} from "../utils/preSaveTokenEncryption.js";

const SPOTIFY_AUTHORIZE_URL =
  "https://accounts.spotify.com/authorize";

const SPOTIFY_TOKEN_URL =
  "https://accounts.spotify.com/api/token";

const SPOTIFY_SCOPE = "user-library-modify";

const getSpotifyConfig = () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_PRESAVE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("Spotify pre-save OAuth environment variables are missing");
  }

  return { clientId, redirectUri };
};

/**
 * GET /api/presaves/spotify/connect
 *
 * Starts Spotify authorization for the current guest.
 */
export const connectSpotify = async (req, res) => {
  try {
    const { clientId, redirectUri } = getSpotifyConfig();

    const { state, codeChallenge } = await createOAuthState({
      guestId: req.guestId,
      provider: "spotify",
      campaignSlug:
        typeof req.query.campaign === "string"
          ? req.query.campaign
          : null,
    });

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: SPOTIFY_SCOPE,
      state,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
    });

    return res.redirect(
      `${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`
    );
  } catch (error) {
    console.error("Spotify connect error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to start Spotify authorization.",
    });
  }
};

/**
 * GET /api/presaves/spotify/callback
 *
 * Handles Spotify's redirect after authorization.
 */
export const spotifyCallback = async (req, res) => {
  try {
    const { clientId, redirectUri } = getSpotifyConfig();

    const { code, state, error } = req.query;

    if (typeof state !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing Spotify authorization state.",
      });
    }

    // Consume the state before processing the response.
    // It can only be used once and must belong to this guest.
    const oauthState = await consumeOAuthState({
      state,
      guestId: req.guestId,
      provider: "spotify",
    });

    if (!oauthState) {
      return res.status(400).json({
        success: false,
        message: "Spotify authorization expired or could not be verified. Please try again.",
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message:
          error === "access_denied"
            ? "Spotify authorization was declined."
            : "Spotify authorization was unsuccessful.",
      });
    }

    if (typeof code !== "string" || !code) {
      return res.status(400).json({
        success: false,
        message: "Spotify did not return an authorization code.",
      });
    }

    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: oauthState.codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      // Do not log the response body: it may contain sensitive details.
      console.error(
        "Spotify token exchange failed with status:",
        tokenResponse.status
      );

      return res.status(502).json({
        success: false,
        message: "Spotify could not complete the authorization. Please try again.",
      });
    }

    const tokenData = await tokenResponse.json();

    if (
      typeof tokenData.access_token !== "string" ||
      !tokenData.access_token ||
      !Number.isFinite(Number(tokenData.expires_in))
    ) {
      return res.status(502).json({
        success: false,
        message: "Spotify returned an invalid authorization response.",
      });
    }

    const encryptionContext = `presave:spotify:${req.guestId}`;

    const accessTokenEncrypted = encryptPreSaveToken(
      tokenData.access_token,
      encryptionContext
    );

    const updateFields = {
      accessTokenEncrypted,
      tokenExpiresAt: new Date(
        Date.now() + Number(tokenData.expires_in) * 1000
      ),
      scopes:
        typeof tokenData.scope === "string"
          ? tokenData.scope.split(" ").filter(Boolean)
          : [],
      tokenType: tokenData.token_type || "Bearer",
      status: "active",
      authorizedAt: new Date(),
      revokedAt: null,
    };

    // Spotify may not return a new refresh token in every response.
    // Preserve an existing one if it does not return a replacement.
    if (
      typeof tokenData.refresh_token === "string" &&
      tokenData.refresh_token
    ) {
      updateFields.refreshTokenEncrypted = encryptPreSaveToken(
        tokenData.refresh_token,
        encryptionContext
      );
    }

    await PreSaveAuthorization.findOneAndUpdate(
      {
        guestId: req.guestId,
        provider: "spotify",
      },
      {
        $set: updateFields,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      connected: true,
      provider: "spotify",
      message: "Spotify has been connected successfully.",
      campaignSlug: oauthState.campaignSlug,
    });
  } catch (error) {
    console.error("Spotify callback error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to complete Spotify authorization.",
    });
  }
};
