import axios from "axios";

export async function resolveDeezer(entity) {
  try {
    // FIRST: ISRC MATCH
    if (entity.isrc) {
      const isrcRes = await axios.get(
        `https://api.deezer.com/track/isrc:${entity.isrc}`,
      );

      if (isrcRes.data?.link) {
        return {
          platform: "deezer",
          url: isrcRes.data.link,
          confidence: 1,
        };
      }
    }

    // FALLBACK SEARCH
    const query = `${entity.artist} ${entity.title}`;

    const searchRes = await axios.get("https://api.deezer.com/search", {
      params: {
        q: query,
      },
    });

    const match = searchRes.data?.data?.[0];

    if (!match) return null;

    return {
      platform: "deezer",
      url: match.link,
      confidence: 0.8,
    };
  } catch {
    return null;
  }
}
