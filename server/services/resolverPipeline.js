import { resolveApple } from "../utils/resolvers/appleResolver.js";
import { resolveDeezer } from "../utils/resolvers/deezerResolver.js";
import { resolveYouTube } from "../utils/resolvers/youtubeResolver.js";

export async function runResolvers(entity) {
  const results = await Promise.allSettled([
    resolveApple(entity),
    resolveDeezer(entity),
    resolveYouTube(entity),
  ]);

  const successful = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value)
    .filter(Boolean);

  return successful;
}
