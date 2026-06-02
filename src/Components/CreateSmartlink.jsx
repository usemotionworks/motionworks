import React, { useState, useEffect, useMemo } from "react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export default function CreateSmartlink() {
  const [isrc, setIsrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [releases, setReleases] = useState([]);
  const [isLoadingReleases, setIsLoadingReleases] = useState(true);

  const [selectedRelease, setSelectedRelease] = useState(null);
  const [releaseSearch, setReleaseSearch] = useState("");
  const [manualLinks, setManualLinks] = useState({
    tidal: "",
    pandora: "",
    amazonMusic: "",
    audiomack: "",
    soundcloud: "",
  });

  // Custom configuration states for saving
  const [customSlug, setCustomSlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const { data } = await axios.get("/api/releases");

        // Only distributed releases
        const distributedReleases = data.filter(
          (release) => release.status === "distributed",
        );

        setReleases(distributedReleases);
      } catch (error) {
        console.error("Failed to fetch releases", error);
        toast.error("Failed to load releases");
      } finally {
        setIsLoadingReleases(false);
      }
    };

    fetchReleases();
  }, []);

  const filteredReleases = useMemo(() => {
    return releases.filter((release) => {
      const search = releaseSearch.toLowerCase();

      return (
        release.title?.toLowerCase().includes(search) ||
        release.upc?.toLowerCase().includes(search) ||
        release.primaryArtists?.some((artist) =>
          artist.name.toLowerCase().includes(search),
        )
      );
    });
  }, [releaseSearch, releases]);

  // STEP 1: Fetch metadata preview from your backend Odesli agent route
  const handleFetchMetadata = async (e) => {
    e.preventDefault();

    // Clean up variable naming to clearly reflect input type
    let spotifyInput = isrc.trim();
    if (!spotifyInput) return;

    setLoading(true);
    setError(null);
    setPreviewData(null);

    try {
      const response = await axios.get("/api/lookup", {
        params: {
          url: spotifyInput,
        },
      });

      const result = response.data;
      setPreviewData(result);

      // 💡 result now contains result.appleMusicUrl and result.itunesStoreUrl

      if (result.title) {
        const generatedSlug = result.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");
        setCustomSlug(generatedSlug);
      }
    } catch (err) {
      const serverError =
        err.response?.data?.error || "Could not aggregate streaming platforms";
      toast.error(serverError);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Commit the previewed data back to your MongoDB collection
  const handleSaveSmartlink = async () => {
    if (!customSlug.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      // Merge all links together
      const combinedLinks = {
        spotify: previewData.spotifyUrl,

        // auto-generated
        ...previewData.links,

        // manually added
        ...manualLinks,
      };

      // Remove empty links
      const cleanedLinks = Object.fromEntries(
        Object.entries(combinedLinks).filter(
          ([_, value]) =>
            value && typeof value === "string" && value.trim() !== "",
        ),
      );

      const payload = {
        releaseId: selectedRelease._id,
        isrc: previewData.isrc,
        title: previewData.title,
        artistName: previewData.artist,
        coverArt: previewData.thumbnail,
        slug: customSlug.trim().toLowerCase(),
        externalId: previewData?.externalId?.trim() || undefined,

        links: cleanedLinks,
      };

      const response = await axios.post("/api/lookup/create", payload);

      toast.success("Smartlink deployed successfully");

      setPreviewData(null);
      setIsrc("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to deploy smartlink");
    } finally {
      setIsSaving(false);
    }
  };

  const normalizedLinks = previewData?.links || {};

  const appleLinks =
    normalizedLinks.appleMusic || normalizedLinks.itunes
      ? {
          appleMusic: normalizedLinks.appleMusic,
          itunes: normalizedLinks.itunes,
        }
      : {};

  const otherLinks = Object.fromEntries(
    Object.entries(normalizedLinks).filter(
      ([key]) => key !== "appleMusic" && key !== "itunes",
    ),
  );

  function getSearchUrl(platform, data) {
    const query = encodeURIComponent(`${data.artist} ${data.title}`);
    const soundcloudQuery = encodeURIComponent(data.artist.split(",")[0]);

    switch (platform) {
      case "tidal":
        return `https://tidal.com/search?q=${query}`;

      case "pandora":
        return `https://www.pandora.com/search/${query}`;

      case "amazonMusic":
        return `https://music.amazon.com/search/${query}?filter=IsLibrary%7Cfalse&sc=none`;

      case "audiomack":
        return `https://audiomack.com/search?q=${query}`;

      case "soundcloud":
        return `https://soundcloud.com/search?q=${soundcloudQuery}`;

      default:
        return "#";
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        {/* Title Framing */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#B6B09F]">
            Generate Release Smartlink
          </h1>
          <p className="text-sm text-[#B6B09F] mt-1">
            Input a master recording ISRC to pull distributed platform streaming
            pointers.
          </p>
        </header>

        <section className="bg-[#050505] border border-[#B6B09F] rounded-2xl p-6 mb-8 shadow-xl space-y-6">
          {/* RELEASE SELECTOR */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.3em] text-[#B6B09F] mb-2">
                Select Distributed Release
              </label>

              <input
                type="text"
                placeholder="Search releases..."
                value={releaseSearch}
                onChange={(e) => setReleaseSearch(e.target.value)}
                className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-xl px-4 py-3 text-[#EAE4D5] placeholder-[#B6B09F]/40 focus:outline-none focus:border-[#B6B09F] transition"
              />
            </div>

            <div className="max-h-72 overflow-y-auto border border-[#B6B09F]/10 rounded-xl divide-y divide-[#B6B09F]/10">
              {isLoadingReleases ? (
                <div className="p-4 text-sm text-[#B6B09F]/60">
                  Loading releases...
                </div>
              ) : filteredReleases.length === 0 ? (
                <div className="p-4 text-sm text-[#B6B09F]/60">
                  No distributed releases found.
                </div>
              ) : (
                filteredReleases.map((release) => {
                  const isActive = selectedRelease?._id === release._id;

                  return (
                    <button
                      key={release._id}
                      type="button"
                      onClick={() => setSelectedRelease(release)}
                      className={`w-full text-left p-4 transition-all ${
                        isActive
                          ? "bg-[#EAE4D5]/10 border-l-2 border-[#EAE4D5]"
                          : "hover:bg-[#B6B09F]/5"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {release.artwork ? (
                          <img
                            src={release.artwork}
                            alt={release.title}
                            className="w-14 h-14 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-[#111] flex items-center justify-center">
                            💿
                          </div>
                        )}

                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-[#EAE4D5] truncate">
                            {release.title}
                          </h3>

                          <p className="text-xs text-[#B6B09F]/70 truncate">
                            {release.primaryArtists
                              ?.map((artist) => artist.name)
                              .join(", ")}
                          </p>

                          <p className="text-[10px] uppercase tracking-[0.2em] text-[#B6B09F]/40 mt-1">
                            {release.releaseType}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* SPOTIFY INPUT */}
          <form
            onSubmit={handleFetchMetadata}
            className="flex flex-col sm:flex-row gap-4 items-end"
          >
            <div className="flex-1 w-full">
              <label className="block text-xs font-black uppercase tracking-[0.3em] text-[#B6B09F] mb-2">
                Spotify Track or Album URL
              </label>

              <input
                type="text"
                placeholder="https://open.spotify.com/track/..."
                value={isrc}
                onChange={(e) => setIsrc(e.target.value)}
                disabled={!selectedRelease}
                className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-xl px-4 py-3 text-[#EAE4D5] placeholder-[#B6B09F]/40 font-mono focus:outline-none focus:border-[#B6B09F] transition disabled:opacity-40"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !selectedRelease}
              className="w-full sm:w-auto h-[50px] px-6 rounded-xl bg-[#EAE4D5] text-black text-xs font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition disabled:opacity-40 cursor-pointer"
            >
              {loading ? "Aggregating..." : "Fetch Metadata"}
            </button>
          </form>

          {!selectedRelease && (
            <div className="text-xs text-[#B6B09F]/50 border border-[#B6B09F]/10 rounded-xl p-3">
              Select a distributed release before generating a smartlink.
            </div>
          )}
        </section>

        {/* Meta Output Review & Target Configurations Panel */}
        {previewData && (
          <main className="bg-[#050505] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 animate-fadeIn">
            <h3 className="text-sm font-semibold uppercase text-[#B6B09F] tracking-wider border-b border-slate-800 pb-2">
              Step 2: Review Metadata & Deploy Links
            </h3>

            {/* Catalog Info Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#050505] p-4 border border-slate-800 rounded-lg">
              {previewData.thumbnail ? (
                <img
                  src={previewData.thumbnail}
                  alt="Cover Preview"
                  className="w-20 h-20 rounded-md object-cover shadow-md"
                />
              ) : (
                <div className="w-20 h-20 bg-[#050505] rounded-md flex items-center justify-center text-2xl">
                  💿
                </div>
              )}
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white leading-tight">
                  {previewData.title}
                </h2>
                <p className="text-[#B6B09F] text-sm font-medium">
                  {previewData.artist}
                </p>
                <div className="inline-block bg-[#050505] text-[#B6B09F] text-xs px-2 py-0.5 rounded font-mono mt-1">
                  ISRC OR UPC: {previewData.isrc || previewData.externalId}
                </div>
              </div>
            </div>

            {/* Custom URL Slug Modification Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#B6B09F]">
                Custom Link Path (URL Slug)
              </label>
              <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-[#050505] focus-within:border-cyan-500 transition-colors">
                <span className="bg-[#050505] text-[#B6B09F] px-3 py-2.5 text-sm font-medium select-none flex items-center border-r border-slate-700">
                  motionworks.lnk.to/
                </span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) =>
                    setCustomSlug(
                      e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    )
                  }
                  className="w-full bg-transparent px-3 py-2 text-sm text-white focus:outline-none font-mono"
                  placeholder="release-title"
                />
              </div>
            </div>

            {/* Parsed Aggregated Platform Output Table Check */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-[0.3em] text-[#B6B09F]">
                Resolved Destination Pointers
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Spotify */}
                {previewData?.spotifyUrl && (
                  <div className="bg-[#050505] border border-[#B6B09F]/10 rounded-xl p-4 hover:border-[#B6B09F]/40 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-[0.25em] text-[#B6B09F]">
                        Spotify
                      </span>

                      <span className="text-[10px] uppercase tracking-wider text-emerald-400">
                        Source
                      </span>
                    </div>

                    <a
                      href={previewData.spotifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-xs text-[#EAE4D5]/80 font-mono break-all hover:text-[#EAE4D5] transition"
                    >
                      {previewData.spotifyUrl}
                    </a>
                  </div>
                )}
                {(appleLinks.appleMusic || appleLinks.itunes) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#050505] border border-[#B6B09F]/10 rounded-xl p-4">
                      <span className="text-xs uppercase tracking-[0.25em] text-[#B6B09F]">
                        Apple Music
                      </span>

                      {appleLinks.appleMusic && (
                        <a
                          href={appleLinks.appleMusic}
                          target="_blank"
                          className="block text-xs text-[#EAE4D5]/80 font-mono mt-2 break-all"
                        >
                          Stream Version
                        </a>
                      )}
                    </div>

                    <div className="bg-[#050505] border border-[#B6B09F]/10 rounded-xl p-4">
                      <span className="text-xs uppercase tracking-[0.25em] text-[#B6B09F]">
                        iTunes Store
                      </span>

                      {appleLinks.itunes && (
                        <a
                          href={`${appleLinks.itunes}?ls=1&app=itunes`}
                          target="_blank"
                          className="block text-xs text-[#EAE4D5]/80 font-mono mt-2 break-all"
                        >
                          Purchase Version
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(otherLinks).map(([platform, url]) => (
                  <div
                    key={platform}
                    className="bg-[#050505] border border-[#B6B09F]/10 rounded-xl p-4"
                  >
                    <span className="text-xs uppercase tracking-[0.25em] text-[#B6B09F]">
                      {platform}
                    </span>

                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        className="block text-xs text-[#EAE4D5]/80 font-mono mt-2 break-all"
                      >
                        {url}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-600 italic">
                        Missing link
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3 mt-6">
              <label className="block text-xs font-black uppercase tracking-[0.3em] text-[#B6B09F]">
                Manual Platform Inputs
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(manualLinks).map(([platform, value]) => (
                  <div
                    key={platform}
                    className="group bg-[#050505] border border-[#B6B09F]/10 rounded-xl p-4 flex flex-col gap-3 hover:border-[#B6B09F]/40 transition-all"
                  >
                    {/* Header row */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs uppercase tracking-[0.25em] text-[#B6B09F]">
                        {platform}
                      </span>

                      <a
                        href={getSearchUrl(platform, previewData)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] uppercase tracking-wider text-[#EAE4D5]/60 hover:text-[#EAE4D5] transition"
                      >
                        Search →
                      </a>
                    </div>

                    {/* Input */}
                    <input
                      value={value}
                      onChange={(e) =>
                        setManualLinks((prev) => ({
                          ...prev,
                          [platform]: e.target.value,
                        }))
                      }
                      className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-[#B6B09F]/60 focus:outline-none transition"
                      placeholder="Paste link here"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Commit Submit Action Button */}
            <div className="pt-2">
              <button
                onClick={handleSaveSmartlink}
                disabled={isSaving || !customSlug}
                className="w-full bg-[#050505] border border-[#B6B09F] hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-800 disabled:to-slate-800 text-[#B6B09F] font-bold py-3 px-4 rounded-lg transition-all transform tracking-wide cursor-pointer shadow-lg text-center"
              >
                {isSaving
                  ? "Deploying to Nodes..."
                  : "Generate & Deploy Active Smartlink"}
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
