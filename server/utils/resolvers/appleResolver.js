import axios from "axios";
import { calculateMatchScore } from "../../utils/scoring.js";

// 💡 Custom Axios instance for Apple to bypass Datacenter IP blocking
const appleAxios = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json",
  },
  timeout: 5000,
});

export async function resolveApple(entity) {
  try {
    const primaryArtist = entity.artist ? entity.artist.split(",")[0].trim() : "";
    const cleanTitle = entity.title ? entity.title.trim() : "";

    // -------------------------------------------------------------
    // 0️⃣ OPTIONAL STEP: Direct ISRC/UPC Lookup (Highest Accuracy)
    // -------------------------------------------------------------
    const code = entity.isrc || entity.upc || entity.externalId;
    if (code) {
      try {
        const directLookup = await appleAxios.get("https://itunes.apple.com/lookup", {
          params: { [entity.type === "album" ? "upc" : "isrc"]: code },
        });

        const directResult = directLookup.data?.results?.[0];
        if (directResult) {
          const url = entity.type === "album" ? directResult.collectionViewUrl : directResult.trackViewUrl;
          if (url) {
            return {
              platform: "appleMusic",
              appleMusicUrl: url,
              itunesStoreUrl: url,
              confidence: 1.0,
            };
          }
        }
      } catch (err) {
        // Continue to fallback if ISRC fails
      }
    }

    // -------------------------------------------------------------
    // 1️⃣ STEP 1: Find Artist Apple ID
    // -------------------------------------------------------------
    let artistId = null;
    if (primaryArtist) {
      const artistSearch = await appleAxios.get("https://itunes.apple.com/search", {
        params: {
          term: primaryArtist,
          entity: "musicArtist",
          limit: 10,
          country: "US",
        },
      });

      const artistResults = artistSearch.data?.results || [];
      const foundArtist = artistResults.find((r) => {
        const name = r.artistName?.toLowerCase() || "";
        const target = primaryArtist.toLowerCase();
        return name === target || name.includes(target) || target.includes(name);
      });

      artistId = foundArtist?.artistId;
    }

    // -------------------------------------------------------------
    // 2️⃣ STEP 2: Lookup Artist Releases by ID
    // -------------------------------------------------------------
    if (artistId && entity.type === "album") {
      const albumLookup = await appleAxios.get("https://itunes.apple.com/lookup", {
        params: {
          id: artistId,
          entity: "album",
          limit: 25,
        },
      });

      const albums = albumLookup.data?.results || [];
      const foundAlbum = albums.find(
        (r) =>
          r.collectionName &&
          r.collectionName.toLowerCase().includes(cleanTitle.toLowerCase())
      );

      if (foundAlbum?.collectionViewUrl) {
        return {
          platform: "appleMusic",
          appleMusicUrl: foundAlbum.collectionViewUrl,
          itunesStoreUrl: foundAlbum.collectionViewUrl,
          confidence: 1.0,
        };
      }
    }

    // -------------------------------------------------------------
    // 3️⃣ STEP 3: Fallback Keyword Search
    // -------------------------------------------------------------
    const searchTerm = `${primaryArtist} ${cleanTitle}`.trim();
    const response = await appleAxios.get("https://itunes.apple.com/search", {
      params: {
        term: searchTerm,
        media: "music",
        entity: entity.type === "album" ? "album" : "song",
        limit: 15,
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
    if (best.score < 25) return null;

    const targetUrl =
      entity.type === "album"
        ? best.candidate.collectionViewUrl
        : best.candidate.trackViewUrl;

    return {
      platform: "appleMusic",
      appleMusicUrl: targetUrl,
      itunesStoreUrl: targetUrl,
      confidence: best.score / 100,
    };
  } catch (error) {
    console.error("Apple Resolver Error:", error.message);
    return null;
  }
}
