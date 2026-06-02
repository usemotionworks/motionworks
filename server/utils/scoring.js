import { normalizeString } from "./normalize.js";

export function calculateMatchScore(entity, candidate) {
  let score = 0;

  const entityTitle = normalizeString(entity.title);
  const entityArtist = normalizeString(entity.artist);

  const candidateTitle = normalizeString(
    candidate.trackName || candidate.collectionName || "",
  );

  const candidateArtist = normalizeString(candidate.artistName || "");

  // TITLE MATCH (improved)
  const exactTitleMatch = entityTitle === candidateTitle;
  const looseTitleMatch =
    candidateTitle.includes(entityTitle) ||
    entityTitle.includes(candidateTitle);

  if (exactTitleMatch) {
    score += 60;
  } else if (looseTitleMatch) {
    score += 35;
  }

  // ARTIST MATCH (bidirectional fix)
  if (
    entityArtist.includes(candidateArtist) ||
    candidateArtist.includes(entityArtist)
  ) {
    score += 40;
  }

  // DURATION MATCH (songs only realistically)
  if (entity.type === "song" && entity.duration && candidate.trackTimeMillis) {
    const diff = Math.abs(entity.duration - candidate.trackTimeMillis);

    if (diff < 3000) {
      score += 30;
    }
  }

  return score;
}
