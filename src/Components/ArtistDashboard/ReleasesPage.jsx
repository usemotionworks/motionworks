import React, { useState, useEffect } from "react";
import { FaMusic, FaPlus, FaGlobe, FaChartLine } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import axios from "../../lib/axios";

const ReleasesPage = () => {
  const navigate = useNavigate();
  const [releases, setReleases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const { data } = await axios.get("/api/releases");
        setReleases(data);
      } catch (error) {
        console.error("Failed to fetch releases", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReleases();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#EAE4D5]">My Releases</h1>
          <p className="text-[#B6B09F] mt-1">
            Manage and track your distributed catalog.
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard/releases/new")}
          className="px-6 py-3 bg-[#EAE4D5] text-[#0a0a0a] font-bold rounded-lg hover:bg-opacity-90 transition-colors"
        >
          New Release
        </button>
      </div>

      {/* Catalog Table Card */}
      <div className="bg-[#0a0a0a] border border-[#B6B09F]/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#B6B09F]/10 flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#EAE4D5]">Active Catalog</h3>
          <span className="text-sm text-[#B6B09F]">
            {isLoading ? "Loading..." : `${releases.length} Items`}
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-[#B6B09F]">
            Loading your catalog...
          </div>
        ) : releases.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-[#B6B09F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaMusic className="text-2xl text-[#B6B09F]/60" />
              </div>
              <h3 className="text-xl font-bold text-[#EAE4D5] mb-2">
                No music found
              </h3>
              <p className="text-[#B6B09F] text-sm mb-6">
                You haven't uploaded any releases yet. Submit your master files
                to start broadcasting to DSPs globally.
              </p>
              <button className="px-5 py-2.5 border border-[#B6B09F]/30 text-[#EAE4D5] hover:border-[#EAE4D5] rounded-lg transition-colors font-medium inline-flex items-center gap-2 text-sm">
                <FaGlobe className="text-xs" /> Read Submission Guidelines
              </button>
            </div>
          </div>
        ) : (
          /* Populated State: The Release List */
          <div className="divide-y divide-[#B6B09F]/10">
            {releases.map((release) => {
              const hasSmartlink =
                release.smartlink ||
                release.smartlinkId ||
                release.hasSmartlink;

              const canCreateSmartlink =
                release.status === "distributed" && !hasSmartlink;

              const canViewAnalytics = hasSmartlink;

              return (
                <div
                  key={release._id}
                  className="p-6 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Artwork Thumbnail */}
                  <div className="w-16 h-16 bg-[#B6B09F]/20 rounded-md overflow-hidden flex-shrink-0">
                    {release.artwork /* 👈 Changed from release.artworkUrl */ ? (
                      <img
                        src={
                          release.artwork
                        } /* 👈 Changed from release.artworkUrl */
                        alt={
                          release.title
                        } /* 👈 Changed from release.releaseTitle */
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#B6B09F]">
                        <FaMusic />
                      </div>
                    )}
                  </div>

                  {/* Create Smartlink */}

                  {/* Release Info */}
                  <div className="flex-grow">
                    {/* View Analytics */}
                    {canCreateSmartlink && (
                      <Link
                        to={`/smartlink/create-smartlink`}
                        className="px-4 py-2 text-xs font-bold bg-[#EAE4D5] text-[#050505] rounded-lg hover:opacity-90 transition-all inline-flex items-center gap-2"
                      >
                        <FaPlus className="text-[10px]" />
                        Create Smartlink
                      </Link>
                    )}
                    {canViewAnalytics && (
                      <Link
                        to={`/smartlink/analytics`}
                        className="px-4 py-2 text-xs font-bold border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/10 transition-all inline-flex items-center gap-2"
                      >
                        <FaChartLine className="text-[10px]" />
                        View Your Smartlink Analytics
                      </Link>
                    )}
                    <h4 className="text-[#EAE4D5] font-bold text-lg">
                      {release.title}{" "}
                      {/* 👈 Changed from release.releaseTitle */}
                    </h4>
                    <p className="text-[#B6B09F] text-sm">
                      {release.releaseType}{" "}
                      {/* 👈 Show the type since artist is just an ID for now */}
                    </p>
                  </div>

                  {/* Status & Date */}
                  <div className="text-right">
                    {/* 👈 Dynamically pulling the actual status and styling based on it */}
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-1 ${
                        release.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-[#B6B09F]/10 text-[#B6B09F]"
                      }`}
                    >
                      {release.status.charAt(0).toUpperCase() +
                        release.status.slice(1)}
                    </span>
                    <p className="text-[#B6B09F] text-xs">
                      {new Date(release.releaseDate).toLocaleDateString()}
                    </p>
                  </div>
                  {(release.status === "draft" ||
                    release.status === "rejected") && (
                    <button
                      onClick={() =>
                        navigate(`/dashboard/releases/edit/${release._id}`)
                      }
                      className="px-4 py-2 text-xs font-bold border border-[#B6B09F]/20 text-[#EAE4D5] rounded hover:bg-[#B6B09F]/10 transition-all"
                    >
                      {release.status === "draft"
                        ? "Continue"
                        : "Fix & Resubmit"}
                    </button>
                  )}

                  {release.status === "rejected" && release.rejectionReason && (
                    <div className="mt-2 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                      <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">
                        Issue Found:
                      </p>
                      <p className="text-sm text-[#B6B09F] italic">
                        "{release.rejectionReason}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReleasesPage;
