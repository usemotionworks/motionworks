import React, { useEffect, useState } from "react";
import axios from "../../lib/axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

export default function AdminCreateSmartlink() {
  const { releaseId } = useParams();

  const navigate = useNavigate();

  const [release, setRelease] = useState(null);

  const [spotifyUrl, setSpotifyUrl] = useState("");

  const [previewData, setPreviewData] = useState(null);

  const [loadingRelease, setLoadingRelease] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [slug, setSlug] = useState("");

  const [manualLinks, setManualLinks] = useState({
    tidal: "",
    pandora: "",
    amazonMusic: "",
    audiomack: "",
    soundcloud: "",
  });

  useEffect(() => {
    const fetchRelease = async () => {
      try {
        const { data } = await axios.get(`/api/releases/${releaseId}`);

        setRelease(data);

        // auto slug generation
        const generatedSlug = data.title
          ?.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");

        setSlug(generatedSlug);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load release");
      } finally {
        setLoadingRelease(false);
      }
    };

    if (releaseId) {
      fetchRelease();
    }
  }, [releaseId]);

  const handleFetchMetadata = async (e) => {
    e.preventDefault();

    if (!spotifyUrl.trim()) return;

    setLoadingMetadata(true);

    try {
      const { data } = await axios.get("/api/lookup", {
        params: {
          url: spotifyUrl.trim(),
        },
      });

      setPreviewData(data);

      // optional smarter slug overwrite
      if (data.title) {
        const generatedSlug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");

        setSlug(generatedSlug);
      }

      toast.success("Metadata aggregated successfully");
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.error || "Failed to aggregate platform metadata",
      );
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleCreate = async () => {
    if (!previewData || !release) return;

    setSubmitting(true);

    try {
      // merge links
      const combinedLinks = {
        spotify: previewData.spotifyUrl,

        // auto aggregated
        ...previewData.links,

        // manual additions
        ...manualLinks,
      };

      // remove empties
      const cleanedLinks = Object.fromEntries(
        Object.entries(combinedLinks).filter(
          ([_, value]) =>
            value && typeof value === "string" && value.trim() !== "",
        ),
      );

      const payload = {
        releaseId: release._id,
        isrc: previewData.isrc,
        title: previewData.title,
        artistName:
          release.releaseOwner?.stageName ||
          previewData.artist ||
          "Unknown Artist",
        coverArt: previewData.thumbnail || release.artwork,
        slug: slug.trim().toLowerCase(),
        links: cleanedLinks,
        externalId: previewData?.externalId?.trim() || undefined,
      };

      await axios.post("/api/lookup/create", payload);

      toast.success("Smartlink deployed successfully");

      navigate(`/share/${slug}`);
    } catch (err) {
      console.error(err);

      toast.error(err.response?.data?.error || "Failed to create smartlink");
    } finally {
      setSubmitting(false);
    }
  };

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

  if (loadingRelease) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#B6B09F] p-10">
        Loading release...
      </div>
    );
  }

  if (!release) {
    return (
      <div className="min-h-screen bg-[#050505] text-red-400 p-10">
        Release not found
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-[#050505] text-[#EAE4D5] p-6 md:p-10">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Smartlink (Admin)</h1>

        <p className="text-sm text-[#B6B09F] mt-2">
          Smartlink deployment powered by Spotify metadata aggregation.
        </p>
      </div>

      {/* RELEASE PREVIEW */}
      <div className="border border-[#B6B09F]/10 rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-4">
          <img
            src={release.artwork}
            alt={release.title}
            className="w-20 h-20 rounded-xl object-cover"
          />

          <div>
            <h2 className="text-xl font-bold">{release.title}</h2>

            <p className="text-sm text-[#B6B09F]">
              {release.releaseOwner?.stageName}
            </p>

            <p className="text-xs text-[#B6B09F]/60 mt-1 font-mono">
              ISRC OR UPC: {release.isrc || release.externalId}
            </p>
          </div>
        </div>
      </div>

      {/* SPOTIFY INPUT */}
      <form
        onSubmit={handleFetchMetadata}
        className="border border-[#B6B09F]/10 rounded-2xl p-6 mb-8"
      >
        <label className="block text-xs uppercase tracking-[0.3em] text-[#B6B09F] mb-3">
          Spotify URL
        </label>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            placeholder="https://open.spotify.com/track/..."
            className="flex-1 bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-xl px-4 py-3 text-sm font-mono"
          />

          <button
            type="submit"
            disabled={loadingMetadata}
            className="px-6 py-3 rounded-xl bg-[#EAE4D5] text-black font-bold"
          >
            {loadingMetadata ? "Aggregating..." : "Fetch Metadata"}
          </button>
        </div>
      </form>

      {/* PREVIEW PANEL */}
      {previewData && (
        <div className="space-y-6">
          {/* PREVIEW */}
          <div className="border border-[#B6B09F]/10 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <img
                src={previewData.thumbnail}
                className="w-20 h-20 rounded-xl object-cover"
              />

              <div>
                <h2 className="text-xl font-bold">{previewData.title}</h2>

                <p className="text-sm text-[#B6B09F]">{previewData.artist}</p>

                <p className="text-xs font-mono text-[#B6B09F]/60 mt-1">
                  ISRC OR UPC: {previewData.isrc || previewData.externalId}
                </p>
              </div>
            </div>
          </div>

          {/* SLUG */}
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-[#B6B09F]">
              Smartlink Slug
            </label>

            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full mt-3 px-4 py-3 bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-xl text-sm font-mono"
            />
          </div>

          {/* PLATFORM LINKS */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-[0.3em] text-[#B6B09F]">
              Aggregated Platform Links
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {previewData.spotifyUrl && (
                <div className="border border-[#B6B09F]/10 rounded-xl p-4">
                  <p className="text-xs uppercase text-[#B6B09F] mb-2">
                    Spotify
                  </p>

                  <a
                    href={previewData.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs break-all text-[#EAE4D5]/80"
                  >
                    {previewData.spotifyUrl}
                  </a>
                </div>
              )}

              {appleLinks.appleMusic && (
                <div className="border border-[#B6B09F]/10 rounded-xl p-4">
                  <p className="text-xs uppercase text-[#B6B09F] mb-2">
                    Apple Music
                  </p>

                  <a
                    href={appleLinks.appleMusic}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs break-all text-[#EAE4D5]/80"
                  >
                    {appleLinks.appleMusic}
                  </a>
                </div>
              )}

              {Object.entries(otherLinks).map(([platform, url]) => (
                <div
                  key={platform}
                  className="border border-[#B6B09F]/10 rounded-xl p-4"
                >
                  <p className="text-xs uppercase text-[#B6B09F] mb-2">
                    {platform}
                  </p>

                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs break-all text-[#EAE4D5]/80"
                  >
                    {url}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* MANUAL LINKS */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-[0.3em] text-[#B6B09F]">
              Manual Platform Inputs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(manualLinks).map(([platform, value]) => (
                <div
                  key={platform}
                  className="border border-[#B6B09F]/10 rounded-xl p-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs uppercase text-[#B6B09F]">
                      {platform}
                    </span>

                    <a
                      href={getSearchUrl(platform, previewData)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-[#B6B09F]/60 hover:text-white"
                    >
                      Search →
                    </a>
                  </div>

                  <input
                    value={value}
                    onChange={(e) =>
                      setManualLinks((prev) => ({
                        ...prev,
                        [platform]: e.target.value,
                      }))
                    }
                    placeholder="Paste URL"
                    className="w-full bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* DEPLOY */}
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-[#EAE4D5] text-black font-black uppercase tracking-[0.2em]"
          >
            {submitting ? "Deploying Smartlink..." : "Create Smartlink"}
          </button>
        </div>
      )}
    </div>
  );
}
