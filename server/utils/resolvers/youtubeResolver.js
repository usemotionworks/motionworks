import { Innertube } from "youtubei.js";

const youtube = await Innertube.create();

export async function resolveYouTube(entity) {
  try {
    const query = `${entity.artist} ${entity.title}`;

    const results = await youtube.search(query, {
      type: "video",
    });

    const video = results.results?.[0];

    if (!video?.id) {
      return null;
    }

    const videoId = video.id;

    return {
      platform: "youtube",

      url: `https://youtube.com/watch?v=${videoId}`,

      youtubeMusicUrl: `https://music.youtube.com/watch?v=${videoId}`,

      confidence: 0.85,
    };
  } catch (error) {
    console.error("YouTube resolver failed:", error.message);

    return null;
  }
}
