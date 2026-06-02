import axios from "axios";
import { calculateMatchScore } from "../../utils/scoring.js";

export async function resolveApple(entity) {
  try {
    const primaryArtist = entity.artist.split(",")[0].trim();

    // 1️⃣ STEP 1: Find the Artist's Unique Apple ID
    // This is much more accurate than searching for the album title directly
    const artistSearch = await axios.get("https://itunes.apple.com/search", {
      params: {
        term: primaryArtist,
        entity: "musicArtist",
        limit: 5,
        country: "US", // Or "NG"
      },
    });

    const artistId = artistSearch.data?.results?.find(
      (r) => r.artistName.toLowerCase() === primaryArtist.toLowerCase(),
    )?.artistId;

    // 2️⃣ STEP 2: If we found an Artist ID, look up their albums specifically
    if (artistId && entity.type === "album") {
      const albumLookup = await axios.get("https://itunes.apple.com/lookup", {
        params: {
          id: artistId,
          entity: "album",
        },
      });

      // Filter the artist's albums for the one that matches our title
      const foundAlbum = albumLookup.data?.results?.find(
        (r) =>
          r.collectionName &&
          r.collectionName.toLowerCase().includes(entity.title.toLowerCase()),
      );

      if (foundAlbum) {
        return {
          platform: "appleMusic",
          appleMusicUrl: foundAlbum.collectionViewUrl,
          itunesStoreUrl: foundAlbum.collectionViewUrl,
          confidence: 1.0,
        };
      }
    }

    // 3️⃣ STEP 3: FALLBACK (The keyword search we tried before)
    // We only reach here if the Artist ID lookup failed
    const searchTerm = `${primaryArtist} ${entity.title}`;
    const response = await axios.get("https://itunes.apple.com/search", {
      params: {
        term: searchTerm,
        media: "music",
        entity: entity.type === "album" ? "album" : "song",
        attribute: entity.type === "album" ? "albumTerm" : "songTerm",
        limit: 10,
        country: "US",
      },
    });

    const results = response.data?.results || [];
    if (!results.length) return null;

    const scored = results
      .map((candidate) => ({
        candidate,
        score: calculateMatchScore(entity, candidate),
      }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (best.score < 30) return null; // Lowered threshold slightly for fallback

    return {
      platform: "appleMusic",
      appleMusicUrl:
        entity.type === "album"
          ? best.candidate.collectionViewUrl
          : best.candidate.trackViewUrl,
      itunesStoreUrl:
        entity.type === "album"
          ? best.candidate.collectionViewUrl
          : best.candidate.trackViewUrl,
      confidence: best.score / 100,
    };
  } catch (error) {
    console.error("Apple ID-First Resolver failed:", error.message);
    return null;
  }
}
