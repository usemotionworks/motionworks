
import Release from "../../../models/Release.js";
import ReleaseDSPCatalogue from "../../../models/ReleaseDSPCatalogue.js";

import spotifyApi, {
  ensureSpotifyAuthenticated,
} from "../../../utils/spotify.js";

const SEARCH_LIMIT = 10;

const SPOTIFY_CATALOGUE_MARKETS = (
  process.env.SPOTIFY_CATALOGUE_MARKETS ||
  process.env.SPOTIFY_CATALOGUE_MARKET ||
  "NG,GB,US"
)
  .split(",")
  .map((market) => market.trim().toUpperCase())
  .filter(Boolean);

const UPC_REGEX = /^(?:\d{8}|\d{12}|\d{13}|\d{14})$/;
const ISRC_REGEX = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;

const formatArtists = (artists = []) =>
  artists
    .map((artist) => artist?.name)
    .filter(Boolean);

const mapAlbumCandidate = (
  album,
  { upc = "", matchedBy = [], market = "" } = {}
) => ({
  externalReleaseId: album.id,
  externalReleaseUrl: album.external_urls?.spotify || "",
  title: album.name || "",
  artists: formatArtists(album.artists),
  upc: album.external_ids?.upc || upc || "",
  releaseDate: album.release_date || "",
  artworkUrl: album.images?.[0]?.url || "",
  matchedBy,
  matchedMarkets: market ? [market] : [],
  tracks: [],
});

const mapTrackCandidate = (
  track,
  searchedIsrc,
  matchedMarket
) => ({
  externalTrackId: track.id,
  externalTrackUrl: track.external_urls?.spotify || "",
  title: track.name || "",
  artists: formatArtists(track.artists),
  isrc: track.external_ids?.isrc || searchedIsrc,
  matchedMarket: matchedMarket || "",
});


// Search one market at a time.
// Stop at the first market that returns results.
const searchAcrossMarkets = async (searchFunction) => {
  const marketsChecked = [];

  for (const market of SPOTIFY_CATALOGUE_MARKETS) {
    const items = await searchFunction(market);

    marketsChecked.push(market);

    if (items.length > 0) {
      return {
        items,
        matchedMarket: market,
        marketsChecked,
      };
    }
  }

  return {
    items: [],
    matchedMarket: null,
    marketsChecked,
  };
};

const searchAlbumsByUPC = async (upc) => {
  return searchAcrossMarkets(async (market) => {
    const response = await spotifyApi.searchAlbums(
      `upc:${upc}`,
      {
        limit: SEARCH_LIMIT,
        market,
      }
    );

    return response.body.albums?.items || [];
  });
};

const searchTracksByISRC = async (isrc) => {
  return searchAcrossMarkets(async (market) => {
    const response = await spotifyApi.searchTracks(
      `isrc:${isrc}`,
      {
        limit: SEARCH_LIMIT,
        market,
      }
    );

    return response.body.tracks?.items || [];
  });
};

// Add or update a candidate without duplicating it.
const addAlbumCandidate = (
  candidatesById,
  album,
  {
    upc = "",
    matchedBy,
    market,
  }
) => {
  if (!album?.id) return;

  let candidate = candidatesById.get(album.id);

  if (!candidate) {
    candidate = mapAlbumCandidate(album, {
      upc,
      matchedBy: [matchedBy],
      market,
    });

    candidatesById.set(album.id, candidate);
    return;
  }

  if (matchedBy && !candidate.matchedBy.includes(matchedBy)) {
    candidate.matchedBy.push(matchedBy);
  }

  if (
    market &&
    !candidate.matchedMarkets.includes(market)
  ) {
    candidate.matchedMarkets.push(market);
  }

  if (upc && !candidate.upc) {
    candidate.upc = upc;
  }

  if (!candidate.externalReleaseUrl) {
    candidate.externalReleaseUrl =
      album.external_urls?.spotify || "";
  }

  if (!candidate.artworkUrl) {
    candidate.artworkUrl = album.images?.[0]?.url || "";
  }
};

export const discoverSpotifyCatalogue = async (releaseId) => {
  let catalogue;

  try {
    const release = await Release.findById(releaseId);

    if (!release) {
      throw new Error("Release not found");
    }

    console.log(release.status)

    if (release.status !== "distributed") {
      throw new Error(
        "Only distributor-approved releases can be searched."
      );
    }

    if (release.adminTakenDown || release.takedownRequest) {
      throw new Error(
        "This release is unavailable for catalogue discovery."
      );
    }

    const upc = String(release.upc || "").trim();

    const validTracks = (release.tracks || [])
      .map((track) => ({
        track,
        isrc: String(track.isrc || "")
          .trim()
          .toUpperCase(),
      }))
      .filter(({ isrc }) => ISRC_REGEX.test(isrc));

    const hasValidUPC = UPC_REGEX.test(upc);
    const hasValidISRC = validTracks.length > 0;

    if (!hasValidUPC && !hasValidISRC) {
      throw new Error(
        "This release has no valid UPC or track ISRCs for discovery."
      );
    }

    catalogue = await ReleaseDSPCatalogue.findOneAndUpdate(
      {
        releaseId: release._id,
        platform: "spotify",
      },
      {
        $setOnInsert: {
          releaseId: release._id,
          platform: "spotify",
          catalogueStatus: "awaiting_catalogue",
          availabilityStatus: "unknown",
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (catalogue.catalogueStatus === "verified") {
      return {
        success: true,
        alreadyVerified: true,
        message: "Spotify catalogue entry has already been verified.",
        catalogue,
      };
    }

    await ensureSpotifyAuthenticated();

    // Keep previously discovered candidates.
    const candidatesById = new Map();

    for (const existingCandidate of catalogue.candidates || []) {
      const candidate = existingCandidate.toObject
        ? existingCandidate.toObject()
        : { ...existingCandidate };

      candidatesById.set(
        candidate.externalReleaseId,
        candidate
      );
    }

    const diagnostics = {
      marketsConfigured: SPOTIFY_CATALOGUE_MARKETS,
      upcSearch: {
        identifier: upc || "",
        searched: false,
        marketsChecked: [],
        resultCount: 0,
      },
      isrcSearches: [],
    };

    // ----------------------------------------
    // 1. Search album using UPC.
    // ----------------------------------------

    if (hasValidUPC) {
      const result = await searchAlbumsByUPC(upc);

      diagnostics.upcSearch = {
        identifier: upc,
        searched: true,
        marketsChecked: result.marketsChecked,
        resultCount: result.items.length,
      };

      for (const album of result.items) {
        addAlbumCandidate(candidatesById, album, {
          upc,
          matchedBy: "UPC",
          market: result.matchedMarket,
        });
      }
    }

    // ----------------------------------------
    // 2. Search tracks using ISRC.
    // ----------------------------------------

    for (const { track, isrc } of validTracks) {
      const result = await searchTracksByISRC(isrc);

      diagnostics.isrcSearches.push({
        releaseTrackId: track._id,
        title: track.title,
        isrc,
        marketsChecked: result.marketsChecked,
        resultCount: result.items.length,
      });

      for (const spotifyTrack of result.items) {
        const album = spotifyTrack.album;

        if (!album?.id || !spotifyTrack.id) {
          continue;
        }

        addAlbumCandidate(candidatesById, album, {
          matchedBy: "ISRC",
          market: result.matchedMarket,
        });

        const candidate = candidatesById.get(album.id);

        const mappedTrack = mapTrackCandidate(
          spotifyTrack,
          isrc,
          result.matchedMarket
        );


        const alreadyAdded = candidate.tracks.some(
          (existingTrack) =>
            existingTrack.externalTrackId ===
            mappedTrack.externalTrackId
        );

        if (!alreadyAdded) {
          candidate.tracks.push(mappedTrack);
        }
      }
    }

    // ----------------------------------------
    // 3. Save discovery results.
    // ----------------------------------------

    const candidates = Array.from(
      candidatesById.values()
    );

    const catalogueStatus =
      candidates.length > 0
        ? "candidates_found"
        : "not_found";

    const updatedCatalogue =
      await ReleaseDSPCatalogue.findByIdAndUpdate(
        catalogue._id,
        {
          $set: {
            candidates,
            catalogueStatus,
            searchDiagnostics: diagnostics,
            lastCheckedAt: new Date(),
            errorMessage: "",
          },
          $inc: {
            attemptCount: 1,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    const newCandidateCount = candidates.filter(
      (candidate) =>
        !catalogue.candidates.some(
          (existing) =>
            existing.externalReleaseId ===
            candidate.externalReleaseId
        )
    ).length;

    return {
      success: true,
      alreadyVerified: false,
      message: candidates.length
        ? "Spotify catalogue candidates found."
        : "No public Spotify catalogue candidates found in the configured markets. This does not confirm that Spotify has not received the unreleased release.",
      candidateCount: candidates.length,
      newCandidateCount,
      marketsSearched: SPOTIFY_CATALOGUE_MARKETS,
      diagnostics,
      catalogue: updatedCatalogue,
    };
  } catch (error) {
    console.error(
      "Spotify catalogue discovery error:",
      error.message
    );

    if (catalogue?._id) {
      try {
        await ReleaseDSPCatalogue.findByIdAndUpdate(
          catalogue._id,
          {
            $set: {
              catalogueStatus: "failed",
              lastCheckedAt: new Date(),
              errorMessage: error.message,
            },
            $inc: {
              attemptCount: 1,
            },
          }
        );
      } catch (updateError) {
        console.error(
          "Failed to update Spotify catalogue status:",
          updateError.message
        );
      }
    }

    throw error;
  }
};
