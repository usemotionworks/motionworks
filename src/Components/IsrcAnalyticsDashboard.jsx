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

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setLoadingReleases(true);
        const isAdmin = user?.role === "admin";
        const endpoint = isAdmin
          ? "/api/admin/distributed-releases"
          : "/api/releases";

        const { data } = await axios.get(endpoint);

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

  const handleSelectRelease = async (release) => {
    try {
      setSelectedRelease(release);
      setLoadingAnalytics(true);
      setError(null);
      setReportData(null);

      const { upc, isrc } = release || {};
      let lastError = null;

      if (upc) {
        try {
          const response = await axios.get(`/api/lookup/by-upc/${upc}`);
          setReportData(response.data);
          return;
        } catch (err) {
          lastError = err;
        }
      }

      if (isrc) {
        try {
          const response = await axios.get(`/api/lookup/by-isrc/${isrc}`);
          setReportData(response.data);
          return;
        } catch (err) {
          lastError = err;
        }
      }

      const errorMessage =
        lastError?.response?.data?.error ||
        lastError?.message ||
        "No analytics found for this release";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Helper calculation for breakdown bars
  const calculatePercentage = (count, total) => {
    if (!total || total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  // Dynamically aggregate locations if not pre-aggregated by backend
  const aggregatedLocations = useMemo(() => {
    // Check both 'countries' (from getSmartlinkSummary) and 'locations'
    const fullCountryData =
      reportData?.analytics?.countries ||
      reportData?.analytics?.locations;

    if (fullCountryData && fullCountryData.length > 0) {
      return fullCountryData;
    }

    // Fallback: Aggregate from recent activity logs if backend returned empty array
    const activity = reportData?.analytics?.recentActivity || [];
    if (!activity.length) return [];

    const counts = {};
    activity.forEach((log) => {
      const country = log.location?.country || "Unknown";
      counts[country] = (counts[country] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([_id, count]) => ({ _id, count }))
      .sort((a, b) => b.count - a.count);
  }, [reportData]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#B6B09F] p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-[#B6B09F]">
            Smartlink Analytics
          </h1>
          <p className="text-sm text-[#B6B09F]/70 mt-2">
            Monitor fan engagement, sources, and traffic properties across releases.
          </p>
        </header>

        {/* Release Browser */}
        <section className="bg-[#050505] border border-[#B6B09F]/20 rounded-xl p-6 shadow-xl">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#B6B09F] mb-2">
                Search Releases
              </label>
              <input
                type="text"
                placeholder="Search by release title or artist..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#B6B09F]/30 rounded-lg px-4 py-3 text-[#B6B09F] placeholder-[#B6B09F]/50 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
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
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[#111] flex items-center justify-center text-lg">
                            💿
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate text-sm">
                            {release.title}
                          </h3>
                          <p className="text-xs text-[#B6B09F]/70 truncate">
                            {artistNames}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="p-4 bg-red-950/30 border border-red-800 rounded-lg text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}

        {loadingAnalytics ? (
          <div className="border border-[#B6B09F]/20 rounded-xl p-8 text-center text-[#B6B09F]/70">
            Aggregating analytics...
          </div>
        ) : (
          reportData && (
            <main className="space-y-6 animate-fadeIn">
              {/* Header Overview */}
              <div className="bg-[#050505] border border-[#B6B09F]/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {reportData.meta?.coverArt ? (
                    <img
                      src={reportData.meta.coverArt}
                      alt="Cover"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[#111] rounded-lg flex items-center justify-center text-[#B6B09F]">
                      💿
                    </div>
                  )}

                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {reportData.meta?.title || selectedRelease?.title}
                    </h2>
                    <p className="text-[#B6B09F] text-sm">
                      {reportData.meta?.artistName || "Analytics View"}
                    </p>
                  </div>
                </div>

                <div className="text-center md:text-right">
                  <span className="text-xs uppercase tracking-widest text-[#B6B09F] block mb-1">
                    Total Fan Actions
                  </span>
                  <span className="text-4xl font-extrabold text-emerald-400">
                    {reportData.meta?.totalClicks || 0}
                  </span>
                </div>
              </div>

              {/* Grid Layout 1: Platforms & Traffic Sources */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Destination Split */}
                <div className="bg-[#050505] border border-[#B6B09F]/20 rounded-xl p-6">
                  <h3 className="text-xs font-semibold uppercase text-[#B6B09F] mb-4 tracking-wider border-b border-[#B6B09F]/20 pb-2">
                    Destination Platforms
                  </h3>
                  <div className="space-y-3">
                    {reportData?.analytics?.platforms?.map((item) => {
                      const pct = calculatePercentage(
                        item.count,
                        reportData.meta?.totalClicks,
                      );
                      return (
                        <div key={item._id} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="capitalize text-white">
                              {item._id}
                            </span>
                            <span className="text-[#B6B09F]">
                              {item.count} clicks ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Referrers */}
                <div className="bg-[#050505] border border-[#B6B09F]/20 rounded-xl p-6">
                  <h3 className="text-xs font-semibold uppercase text-[#B6B09F] mb-4 tracking-wider border-b border-[#B6B09F]/20 pb-2">
                    Referrer Sources
                  </h3>
                  <div className="space-y-3">
                    {reportData?.analytics?.referrers?.map((item) => {
                      const pct = calculatePercentage(
                        item.count,
                        reportData.meta?.totalClicks,
                      );
                      return (
                        <div
                          key={item._id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-white truncate max-w-[220px]">
                            {item._id === "direct"
                              ? "Direct / In-App Link"
                              : item._id}
                          </span>
                          <span className="bg-[#111] px-2 py-1 rounded text-[#B6B09F] font-mono">
                            {item.count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Grid Layout 2: Tech Specs & Geographic Locations */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Geographic Locations */}
                <div className="bg-[#050505] border border-[#B6B09F]/20 rounded-xl p-6">
                  <h3 className="text-xs font-semibold uppercase text-[#B6B09F] mb-4 tracking-wider border-b border-[#B6B09F]/20 pb-2">
                    Top Locations
                  </h3>
                  <div className="space-y-3">
                    {aggregatedLocations.length === 0 ? (
                      <p className="text-xs text-[#B6B09F]/50">No location data</p>
                    ) : (
                      aggregatedLocations.map((item) => {
                        const pct = calculatePercentage(
                          item.count,
                          reportData.meta?.totalClicks,
                        );
                        return (
                          <div key={item._id} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-white truncate">{item._id}</span>
                              <span className="text-[#B6B09F] font-mono">
                                {item.count} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-[#111] h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Browsers & In-App Apps */}
                <div className="bg-[#050505] border border-[#B6B09F]/20 rounded-xl p-6">
                  <h3 className="text-xs font-semibold uppercase text-[#B6B09F] mb-4 tracking-wider border-b border-[#B6B09F]/20 pb-2">
                    Browsers / Apps
                  </h3>
                  <div className="space-y-3">
                    {reportData?.analytics?.browsers?.map((item) => (
                      <div
                        key={item._id}
                        className="flex justify-between items-center text-xs"
                      >
                        <span className="text-white">{item._id}</span>
                        <span className="text-[#B6B09F] font-mono">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operating Systems */}
                <div className="bg-[#050505] border border-[#B6B09F]/20 rounded-xl p-6">
                  <h3 className="text-xs font-semibold uppercase text-[#B6B09F] mb-4 tracking-wider border-b border-[#B6B09F]/20 pb-2">
                    Operating System
                  </h3>
                  <div className="space-y-3">
                    {reportData?.analytics?.operatingSystems?.map((item) => (
                      <div
                        key={item._id}
                        className="flex justify-between items-center text-xs"
                      >
                        <span className="text-white">{item._id}</span>
                        <span className="text-[#B6B09F] font-mono">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Devices */}
                <div className="bg-[#050505] border border-[#B6B09F]/20 rounded-xl p-6">
                  <h3 className="text-xs font-semibold uppercase text-[#B6B09F] mb-4 tracking-wider border-b border-[#B6B09F]/20 pb-2">
                    Device Types
                  </h3>
                  <div className="space-y-3">
                    {reportData?.analytics?.devices?.map((item) => (
                      <div
                        key={item._id}
                        className="flex justify-between items-center text-xs"
                      >
                        <span className="text-white capitalize">
                          {item._id}
                        </span>
                        <span className="text-[#B6B09F] font-mono">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity Log Stream (Limited to 10 Clicks) */}
              <div className="bg-[#050505] border border-[#B6B09F]/20 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4 border-b border-[#B6B09F]/20 pb-2">
                  <h3 className="text-xs font-semibold uppercase text-[#B6B09F] tracking-wider">
                    Recent Stream Logs
                  </h3>
                  <span className="text-[10px] text-[#B6B09F]/60 uppercase tracking-widest font-mono">
                    Showing latest 10 clicks
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#B6B09F]/10 text-[#B6B09F]/60">
                        <th className="pb-2">Time</th>
                        <th className="pb-2">Platform</th>
                        <th className="pb-2">Device</th>
                        <th className="pb-2">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#B6B09F]/10">
                      {reportData?.analytics?.recentActivity
                        ?.slice(0, 10)
                        ?.map((log) => (
                          <tr key={log._id}>
                            <td className="py-2.5 text-[#B6B09F]">
                              {new Date(log.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </td>
                            <td className="py-2.5 font-medium text-white capitalize">
                              {log.platform}
                            </td>
                            <td className="py-2.5 text-[#B6B09F] capitalize">
                              {log.device?.type || "desktop"}
                            </td>
                            <td className="py-2.5 text-[#B6B09F]">
                              {log.location?.country || "Unknown"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </main>
          )
        )}
      </div>
    </div>
  );
}
