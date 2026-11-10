
import SpotifyWebApi from "spotify-web-api-node";
import dotenv from "dotenv";

dotenv.config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

let tokenExpiresAt = 0;
let authenticationPromise = null;

export const authenticateSpotify = async () => {
  // Prevent simultaneous requests from generating multiple tokens.
  if (authenticationPromise) {
    return authenticationPromise;
  }

  authenticationPromise = (async () => {
    try {
      const data = await spotifyApi.clientCredentialsGrant();

      spotifyApi.setAccessToken(data.body.access_token);

      tokenExpiresAt =
        Date.now() + (data.body.expires_in * 1000);

      console.log("Spotify access token refreshed");

      return true;
    } catch (error) {
      console.error("Spotify auth failed:", error.message);
      return false;
    } finally {
      authenticationPromise = null;
    }
  })();

  return authenticationPromise;
};

export const ensureSpotifyAuthenticated = async () => {
  const tokenIsValid =
    tokenExpiresAt > Date.now() + 60_000;

  if (tokenIsValid) {
    return true;
  }

  const authenticated = await authenticateSpotify();

  if (!authenticated) {
    throw new Error("Unable to authenticate with Spotify");
  }

  return true;
};

export default spotifyApi;
