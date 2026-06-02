export async function resolveSpotifyEntity(url, spotifyApi) {
  const trackRegex = /spotify\.com\/track\/([a-zA-Z0-9]+)/;
  const albumRegex = /spotify\.com\/album\/([a-zA-Z0-9]+)/;

  const trackMatch = url.match(trackRegex);
  const albumMatch = url.match(albumRegex);

  if (trackMatch) {
    const trackId = trackMatch[1];
    const response = await spotifyApi.getTrack(trackId);
    const track = response.body;
    return {
      type: "track",
      spotifyId: track.id,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      artists: track.artists.map((a) => a.name),
      album: track.album.name,
      releaseDate: track.album.release_date,
      duration: track.duration_ms,
      isrc: track.external_ids?.isrc || null,
      thumbnail: track.album.images?.[0]?.url,
      spotifyUrl: track.external_urls.spotify,
    };
  }

  if (albumMatch) {
    const albumId = albumMatch[1];
    const response = await spotifyApi.getAlbum(albumId);
    const album = response.body;

    console.log(album);
    return {
      type: "album",
      spotifyId: album.id,
      title: album.name,
      artist: album.artists.map((a) => a.name).join(", "),
      artists: album.artists.map((a) => a.name),
      releaseDate: album.release_date,
      totalTracks: album.total_tracks,
      externalId: album.external_ids?.upc || null,
      thumbnail: album.images?.[0]?.url,
      spotifyUrl: album.external_urls.spotify,
      tracks: album.tracks.items.map((track) => ({
        title: track.name,
        duration: track.duration_ms,
      })),
    };
  }

  throw new Error("Invalid Spotify URL");
}
