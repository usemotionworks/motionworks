import SpotifyWebApi from "spotify-web-api-node";
import dotenv from "dotenv";

dotenv.config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

export const authenticateSpotify = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();

    spotifyApi.setAccessToken(data.body.access_token);

    console.log("✅ Spotify access token refreshed");
  } catch (error) {
    console.error("❌ Spotify auth failed:", error.message);
  }
};

export default spotifyApi;
