import React, { useEffect, useMemo, useState } from "react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useUserStore } from "../store/useUserStore";

export default function IsrcAnalyticsDashboard() {
  const [releases, setReleases] = useState([]);
  const [search, setSearch] = useState("");
  const { user } = useUserStore();

  const [loadingReleases, setLoadingReleases] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [selectedRelease, setSelectedRelease] = useState(null);
  const [reportData, setReportData] = useState(null);

  const [error, setError] = useState(null);

  // Fetch releases that already have smartlinks
  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setLoadingReleases(true);

        // Detect admin user
        const isAdmin = user?.role === "admin";

        // Admins get all distributed releases
        // Regular users get only their releases
        const endpoint = isAdmin
          ? "/api/admin/distributed-releases"
          : "/api/releases";

        const { data } = await axios.get(endpoint);

        // Only releases with smartlinks
        const filtered = data.filter(
          (release) =>
            release.smartlink || release.smartlinkId || release.hasSmartlink,
        );

        setReleases(filtered);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch releases");
      } finally {
        setLoadingReleases(false);
      }
    };

    fetchReleases();
  }, [user]);

  // Search filter
  const filteredReleases = useMemo(() => {
    if (!search.trim()) return releases;

    const query = search.toLowerCase();

    return releases.filter((release) => {
      return (
        release.title?.toLowerCase().includes(query) ||
        release.primaryArtists
          ?.map((artist) => artist.name?.toLowerCase())
          .join(" ")
          .includes(query)
      );
    });
  }, [search, releases]);

  // Fetch analytics
  const handleSelectRelease = async (release) => {
    try {
      setSelectedRelease(release);
      setLoadingAnalytics(true);
      setError(null);
      setReportData(null);

      const isrc = release?.isrc;
      const upc = release?.upc;

      if (upc) {
        const response = await axios.get(`/api/lookup/by-upc/${upc}`);
        setReportData(response.data);
        return;
      }

      if (isrc) {
        const response = await axios.get(`/api/lookup/by-isrc/${isrc}`);
        setReportData(response.data);
        return;
      }

      toast.error("No ISRC or UPC found for this release");
    } catch (err) {
      console.error(err);

      const errorMessage =
        err.response?.data?.error || err.message || "Failed to load analytics";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#B6B09F] p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-[#B6B09F]">
            Smartlink Analytics
          </h1>

          <p className="text-sm text-[#B6B09F]/70 mt-2">
            Monitor fan engagement across your distributed releases.
          </p>
        </header>

        {/* Release Browser */}
        <section className="bg-[#050505] border border-[#B6B09F] rounded-xl p-6 shadow-xl">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#B6B09F] mb-2">
                Search Releases
              </label>

              <input
                type="text"
                placeholder="Search by release title or artist..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#050505] border border-[#B6B09F] rounded-lg px-4 py-3 text-[#B6B09F] placeholder-[#B6B09F]/50 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Releases */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {loadingReleases ? (
                <div className="text-sm text-[#B6B09F]/70 py-4">
                  Loading releases...
                </div>
              ) : filteredReleases.length === 0 ? (
                <div className="text-sm text-[#B6B09F]/70 py-4">
                  No smartlinked releases found.
                </div>
              ) : (
                filteredReleases.map((release) => {
                  const artwork = release.artwork || release.coverArt || null;

                  const artistNames =
                    release.primaryArtists
                      ?.map((artist) => artist.name)
                      .join(", ") || "Unknown Artist";

                  const isSelected = selectedRelease?._id === release._id;

                  return (
                    <button
                      key={release._id}
                      onClick={() => handleSelectRelease(release)}
                      className={`w-full text-left border rounded-xl p-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/5"
                          : "border-[#B6B09F]/20 hover:border-[#B6B09F]/60"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {artwork ? (
                          <img
                            src={artwork}
                            alt={release.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-[#111] flex items-center justify-center text-xl">
                            💿
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate">
                            {release.title}
                          </h3>

                          <p className="text-sm text-[#B6B09F]/70 truncate">
                            {artistNames}
                          </p>

                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase tracking-wider border border-[#B6B09F]/20 px-2 py-1 rounded-md">
                              {release.releaseType}
                            </span>

                            <span className="text-[10px] uppercase tracking-wider border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md">
                              Smartlink Active
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Errors */}
        {error && (
          <div className="p-4 bg-red-950/30 border border-red-800 rounded-lg text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Analytics */}
        {loadingAnalytics ? (
          <div className="border border-[#B6B09F]/20 rounded-xl p-8 text-center text-[#B6B09F]/70">
            Aggregating analytics...
          </div>
        ) : (
          reportData && (
            <main className="space-y-6 animate-fadeIn">
              {/* Meta Tracker Row */}
              <div className="bg-[#050505] border border-[#B6B09F] rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {reportData.meta.coverArt ? (
                    <img
                      src={reportData.meta.coverArt}
                      alt="Cover"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[#050505] rounded-lg flex items-center justify-center text-[#B6B09F]">
                      💿
                    </div>
                  )}

                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {reportData.meta.title}
                    </h2>

                    <p className="text-[#B6B09F] text-sm">
                      {reportData.meta.artistName}
                    </p>
                  </div>
                </div>

                <div className="text-center md:text-right">
                  <span className="text-xs uppercase tracking-widest text-[#B6B09F] block mb-1">
                    Total Fan Actions
                  </span>

                  <span className="text-4xl font-extrabold text-emerald-400">
                    {reportData.meta.totalClicks}
                  </span>
                </div>
              </div>

              {/* Metric Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Platforms */}
                <div className="bg-[#050505] border border-[#B6B09F] rounded-xl p-6">
                  <h3 className="text-sm font-semibold uppercase text-[#B6B09F] mb-4 tracking-wider border-b border-[#B6B09F] pb-2">
                    Destination Split
                  </h3>

                  <div className="space-y-3">
                    {reportData?.analytics?.platforms?.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between"
                      >
                        <span className="capitalize font-medium text-[#B6B09F]">
                          {item._id}
                        </span>

                        <div className="flex items-center gap-3 w-2/3">
                          <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{
                                width: `${
                                  reportData.meta.totalClicks > 0
                                    ? (item.count /
                                        reportData.meta.totalClicks) *
                                      100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>

                          <span className="text-sm font-bold text-[#B6B09F] min-w-[32px] text-right">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}

                    {reportData?.analytics?.platforms?.length === 0 && (
                      <p className="text-[#B6B09F] text-sm py-4">
                        No platform actions logged yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Countries */}
                <div className="bg-[#050505] border border-[#B6B09F] rounded-xl p-6">
                  <h3 className="text-sm font-semibold uppercase text-[#B6B09F] mb-4 tracking-wider border-b border-[#B6B09F] pb-2">
                    Top Geolocation Markets
                  </h3>

                  <div className="space-y-4">
                    {reportData?.analytics?.countries?.map((item, index) => (
                      <div
                        key={item._id || index}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[#B6B09F] font-mono font-bold">
                            0{index + 1}
                          </span>

                          <span className="text-[#B6B09F] font-medium">
                            {item._id || "Unknown Region"}
                          </span>
                        </div>

                        <span className="bg-[#050505] px-3 py-1 border border-[#B6B09F] rounded-md font-semibold text-[#B6B09F]">
                          {item.count} clicks
                        </span>
                      </div>
                    ))}

                    {reportData?.analytics?.countries?.length === 0 && (
                      <p className="text-[#B6B09F] text-sm py-4">
                        No location context stored yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </main>
          )
        )}
      </div>
    </div>
  );
}
