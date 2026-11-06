import React, { useEffect, useMemo, useState } from "react";
import axios from "../../lib/axios";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaPlus, FaChartLine } from "react-icons/fa";

function ReleaseCard({ release, navigate }) {
  const hasSmartlink = !!release.smartlink;

  return (
    <div className="flex items-center justify-between p-4 border border-[#B6B09F]/10 rounded-lg hover:border-[#B6B09F]/40 transition">
      {/* LEFT: INFO */}
      <div className="flex items-center gap-4">
        <img
          src={release.artwork}
          className="w-14 h-14 rounded-md object-cover"
        />

        <div>
          <h3 className="font-bold">{release.title}</h3>
          <p className="text-sm text-[#B6B09F]">
            {release.releaseOwner?.stageName || "Unknown Artist"}
          </p>

          <p className="text-xs text-[#B6B09F]/60 font-mono">
            ISRC: {release.isrc || "N/A"}
          </p>
        </div>
      </div>

      {/* STATUS BADGE */}
      <div className="text-center">
        <span
          className={`text-xs px-3 py-1 rounded-full ${
            hasSmartlink
              ? "bg-green-500/10 text-green-400"
              : "bg-yellow-500/10 text-yellow-400"
          }`}
        >
          {hasSmartlink ? "Smartlink Active" : "Missing Smartlink"}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2">
        {!hasSmartlink ? (
          <button
            onClick={() => navigate(`/admin/smartlink/create/${release._id}`)}
            className="flex items-center gap-2 px-3 py-2 bg-[#B6B09F] text-black rounded-lg text-sm font-semibold"
          >
            <FaPlus /> Create
          </button>
        ) : (
          <button
            onClick={() => navigate(`/smartlink/analytics`)}
            className="flex items-center gap-2 px-3 py-2 border border-[#B6B09F]/30 text-[#EAE4D5] rounded-lg text-sm"
          >
            <FaChartLine /> Analytics
          </button>
        )}
      </div>
    </div>
  );
}

export default function SmartlinkDashboard() {
  const navigate = useNavigate();

  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("needs");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get("/api/admin/distributed-releases");
        setReleases(data);
      } catch (err) {
        console.error("Failed to load releases", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  /**
   * 🔍 GLOBAL SEARCH FILTER
   */
  const filteredReleases = useMemo(() => {
    return releases.filter((r) => {
      const q = search.toLowerCase();

      return (
        r.title?.toLowerCase().includes(q) ||
        r.isrc?.toLowerCase().includes(q) ||
        r.releaseOwner?.stageName?.toLowerCase().includes(q) ||
        r.releaseOwner?.email?.toLowerCase().includes(q)
      );
    });
  }, [releases, search]);

  /**
   * 📦 TAB FILTERING
   */
  const visibleReleases = useMemo(() => {
    return filteredReleases.filter((r) => {
      const hasSmartlink = !!r.smartlink;

      if (activeTab === "needs") return !hasSmartlink;
      if (activeTab === "done") return hasSmartlink;
      return true;
    });
  }, [filteredReleases, activeTab]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#EAE4D5] p-6 md:p-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Smartlink Queue</h1>
          <p className="text-sm text-[#B6B09F]">
            Manage distributed releases and create smartlinks
          </p>
        </div>

        {/* SEARCH */}
        <div className="relative w-full md:w-96">
          <FaSearch className="absolute left-3 top-3 text-[#B6B09F]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, ISRC, artist..."
            className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-lg text-sm focus:outline-none focus:border-[#B6B09F]/60"
          />
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-3 mb-6">
        {[
          { key: "needs", label: "Needs Smartlink" },
          { key: "done", label: "With Smartlinks" },
          { key: "all", label: "All Releases" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm border transition ${
              activeTab === tab.key
                ? "bg-[#B6B09F] text-black"
                : "border-[#B6B09F]/20 text-[#B6B09F] hover:border-[#B6B09F]/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="text-[#B6B09F]">Loading releases...</div>
      ) : (
        <div className="space-y-3">
          {visibleReleases.map((release) => (
            <ReleaseCard
              key={release._id}
              release={release}
              navigate={navigate}
            />
          ))}

          {visibleReleases.length === 0 && (
            <div className="text-[#B6B09F] text-sm py-10 text-center border border-[#B6B09F]/10 rounded-lg">
              No releases found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
