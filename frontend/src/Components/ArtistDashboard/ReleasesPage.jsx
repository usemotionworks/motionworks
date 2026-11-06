import React, { useState, useEffect } from "react";
import {
  FaMusic,
  FaPlus,
  FaGlobe,
  FaChartLine,
  FaTimes,
  FaPlay,
  FaDollarSign,
  FaLayerGroup,
  FaCalendarAlt,
  FaEdit,
} from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import axios from "../../lib/axios";

const ReleasesPage = () => {
  const navigate = useNavigate();
  const [releases, setReleases] = useState([]);
  const [releaseReports, setReleaseReports] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Takedown state
  const [takedownLoading, setTakedownLoading] = useState(null);
  const [takedownRelease, setTakedownRelease] = useState(null);

  // Modal / Detailed report view state
  const [activeReportModal, setActiveReportModal] = useState(null); // stores release + report data
  const [selectedReportIndex, setSelectedReportIndex] = useState(0);
  const [modalTab, setModalTab] = useState("dsp"); // "dsp" | "channel" | "tracks"
  const [fetchingReportDetails, setFetchingReportDetails] = useState(false);

  useEffect(() => {
    const fetchReleasesAndReports = async () => {
      try {
        const { data: releaseList } = await axios.get("/api/releases");
        setReleases(releaseList);

        // Fetch report totals concurrently for each release
        const reportPromises = releaseList.map(async (rel) => {
          try {
            const { data } = await axios.get(`/api/reports/${rel._id}`);
            return { releaseId: rel._id, ...data };
          } catch (err) {
            return {
              releaseId: rel._id,
              totals: { totalStreams: 0, totalConsumptionUnits: 0, totalRevenueUsd: 0 },
              reports: [],
            };
          }
        });

        const reportResults = await Promise.all(reportPromises);
        const reportMap = {};
        reportResults.forEach((res) => {
          reportMap[res.releaseId] = res;
        });

        setReleaseReports(reportMap);
      } catch (error) {
        console.error("Failed to fetch releases", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReleasesAndReports();
  }, []);

  const handleTakedown = async () => {
    if (!takedownRelease) return;

    try {
      setTakedownLoading(takedownRelease._id);

      const { data } = await axios.patch(
        `/api/releases/${takedownRelease._id}/takedown`
      );

      setReleases((prevReleases) =>
        prevReleases.map((release) =>
          release._id === takedownRelease._id
            ? { ...release, takedownRequest: true }
            : release
        )
      );

      setTakedownRelease(null);
    } catch (error) {
      console.error("Failed to request takedown:", error);
      alert(
        error.response?.data?.message || "Failed to submit takedown request."
      );
    } finally {
      setTakedownLoading(null);
    }
  };

  const handleOpenReportModal = async (release) => {
    setFetchingReportDetails(true);
    try {
      const { data } = await axios.get(`/api/reports/${release._id}`);
      setActiveReportModal({
        release,
        reports: data.reports || [],
        totals: data.totals,
      });
      setSelectedReportIndex(0);
    } catch (err) {
      console.error("Failed to load detailed report", err);
    } finally {
      setFetchingReportDetails(false);
    }
  };


  return (
    <div>
      {/* Page Header */}
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

      {/* Catalog Card */}
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
          <div className="divide-y divide-[#B6B09F]/10">
            {releases.map((release) => {
              const hasSmartlink =
                release.smartlink ||
                release.smartlinkId ||
                release.hasSmartlink;

              const smartlinkId =
                typeof release.smartlink === "object"
                  ? release.smartlink?._id
                  : release.smartlink;

              const canCreateSmartlink =
                release.status === "distributed" && !hasSmartlink;

              const canViewAnalytics = hasSmartlink;

              const canEdit =
                release.status === "draft" ||
                release.status === "rejected" ||
                release.status === "pending" ||
                release.status === "distributed";

              const reportData = releaseReports[release._id]?.totals || {
                totalStreams: 0,
                totalConsumptionUnits: 0,
                totalRevenueUsd: 0,
              };

              const hasReports = (releaseReports[release._id]?.reports || []).length > 0;

              return (
                <div
                  key={release._id}
                  className="p-4 sm:p-6 hover:bg-white/[0.02] transition-colors"
                >
                  {/* RELEASE INFO */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Artwork */}
                    <div className="w-16 h-16 bg-[#B6B09F]/20 rounded-md overflow-hidden flex-shrink-0">
                      {release.artwork ? (
                        <img
                          src={release.artwork}
                          alt={release.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#B6B09F]">
                          <FaMusic />
                        </div>
                      )}
                    </div>

                    {/* Meta details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[#EAE4D5] font-bold text-lg truncate">
                        {release.title}
                      </h4>

                      <p className="text-[#B6B09F] text-sm mb-3">
                        {release.releaseType}
                      </p>

                      {/* INLINE STREAM & REVENUE STATS */}
                      <div className="flex flex-wrap items-center gap-4 py-2 px-3 bg-[#B6B09F]/5 border border-[#B6B09F]/10 rounded-lg max-w-xl">
                        <div className="flex items-center gap-1.5 text-xs">
                          <FaPlay className="text-[#B6B09F]/60 text-[10px]" />
                          <span className="text-[#B6B09F]">Streams:</span>
                          <span className="text-[#EAE4D5] font-semibold">
                            {reportData.totalStreams.toLocaleString()}
                          </span>
                        </div>

                        <div className="h-3 w-px bg-[#B6B09F]/20" />

                        <div className="flex items-center gap-1.5 text-xs">
                          <FaLayerGroup className="text-[#B6B09F]/60 text-[10px]" />
                          <span className="text-[#B6B09F]">Consumption:</span>
                          <span className="text-[#EAE4D5] font-semibold">
                            {reportData.totalConsumptionUnits.toLocaleString()}
                          </span>
                        </div>

                        <div className="h-3 w-px bg-[#B6B09F]/20" />

                        <div className="flex items-center gap-1.5 text-xs">
                          <FaDollarSign className="text-emerald-400 text-[10px]" />
                          <span className="text-[#B6B09F]">Total Revenue:</span>
                          <span className="text-emerald-400 font-bold">
                            ${reportData.totalRevenueUsd.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Date */}
                    <div className="sm:text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-1 ${
                          release.status === "pending"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : release.status === "rejected"
                            ? "bg-red-500/10 text-red-400"
                            : release.status === "distributed"
                            ? "bg-emerald-500/10 text-emerald-400"
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
                  </div>

                  {/* ACTIONS BAR */}
                  <div className="mt-5 pt-5 border-t border-[#B6B09F]/10">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* View Reports Action */}
                      {hasReports && (
                        <button
                          onClick={() => handleOpenReportModal(release)}
                          disabled={fetchingReportDetails}
                          className="px-4 py-2 text-xs font-bold border border-[#EAE4D5]/30 text-[#EAE4D5] bg-[#EAE4D5]/5 rounded-lg hover:bg-[#EAE4D5]/10 transition-all inline-flex items-center gap-2"
                        >
                          <FaChartLine className="text-[10px]" />
                          View Financial Statement
                        </button>
                      )}

                      {canCreateSmartlink && (
                        <Link
                          to="/smartlink/create-smartlink"
                          className="px-4 py-2 text-xs font-bold bg-[#EAE4D5] text-[#050505] rounded-lg hover:opacity-90 transition-all inline-flex items-center gap-2"
                        >
                          <FaPlus className="text-[10px]" />
                          Create Smartlink
                        </Link>
                      )}

                      {hasSmartlink && smartlinkId && (
                        <Link
                          to={`/smartlink/edit/${smartlinkId}`}
                          className="px-4 py-2 text-xs font-bold border border-[#B6B09F]/30 text-[#EAE4D5] rounded-lg hover:bg-[#B6B09F]/10 transition-all inline-flex items-center gap-2"
                        >
                          <FaEdit className="text-[10px]" />
                          Edit Smartlink
                        </Link>
                      )}

                      {canViewAnalytics && (
                        <Link
                          to="/smartlink/analytics"
                          className="px-4 py-2 text-xs font-bold border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/10 transition-all inline-flex items-center gap-2"
                        >
                          <FaChartLine className="text-[10px]" />
                          View Smartlink Analytics
                        </Link>
                      )}

                      {canEdit && (
                        <button
                          onClick={() =>
                            navigate(`/dashboard/releases/edit/${release._id}`)
                          }
                          className="px-4 py-2 text-xs font-bold border border-[#B6B09F]/20 text-[#EAE4D5] rounded-lg hover:bg-[#B6B09F]/10 transition-all"
                        >
                          {release.status === "draft"
                            ? "Continue"
                            : release.status === "distributed"
                            ? "Make Changes"
                            : "Resubmit"}
                        </button>
                      )}

                      {release.status === "distributed" &&
                        (release.adminTakenDown ? (
                          <span className="px-4 py-2 text-xs font-bold border border-red-500/20 text-red-400 bg-red-500/5 rounded-lg">
                            Taken Down
                          </span>
                        ) : release.takedownRequest ? (
                          <span className="px-4 py-2 text-xs font-bold border border-yellow-500/20 text-yellow-400 bg-yellow-500/5 rounded-lg">
                            Take Down Requested
                          </span>
                        ) : (
                          <button
                            onClick={() => setTakedownRelease(release)}
                            className="px-4 py-2 text-xs font-bold border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                          >
                            Request Take Down
                          </button>
                        ))}
                    </div>
                  </div>

                  {release.status === "rejected" && release.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
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

      {/* TAKEDOWN CONFIRMATION MODAL */}
      {takedownRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !takedownLoading && setTakedownRelease(null)}
          />
          <div className="relative w-full max-w-md bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-xl shadow-2xl p-6">
            <h2 className="text-xl font-bold text-[#EAE4D5]">
              Request Take Down?
            </h2>
            <p className="mt-3 text-sm text-[#B6B09F] leading-relaxed">
              Are you sure you want to request a take down for{" "}
              <span className="text-[#EAE4D5] font-semibold">
                {takedownRelease.title}
              </span>
              ?
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setTakedownRelease(null)}
                disabled={takedownLoading === takedownRelease._id}
                className="px-4 py-2 text-sm font-medium border border-[#B6B09F]/20 text-[#B6B09F] rounded-lg hover:bg-[#B6B09F]/10 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTakedown}
                disabled={takedownLoading === takedownRelease._id}
                className="px-4 py-2 text-sm font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {takedownLoading === takedownRelease._id
                  ? "Submitting..."
                  : "Confirm Take Down"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED REPORT MODAL */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setActiveReportModal(null)}
          />
          <div className="relative w-full max-w-3xl bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-[#B6B09F]/10 flex items-center justify-between bg-white/[0.01]">
              <div>
                <h3 className="text-xl font-bold text-[#EAE4D5]">
                  {activeReportModal.release.title} — Reports
                </h3>
                <p className="text-[#B6B09F] text-xs mt-1">
                  Detailed consumption, channel, and store revenue statements.
                </p>
              </div>
              <button
                onClick={() => setActiveReportModal(null)}
                className="p-2 text-[#B6B09F] hover:text-[#EAE4D5] transition-colors rounded-lg hover:bg-white/5"
              >
                <FaTimes />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Report Month Selector */}
              {activeReportModal.reports.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#B6B09F]/10">
                  <FaCalendarAlt className="text-[#B6B09F] text-xs mr-2" />
                  {activeReportModal.reports.map((rpt, idx) => (
                    <button
                      key={rpt._id}
                      onClick={() => setSelectedReportIndex(idx)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        selectedReportIndex === idx
                          ? "bg-[#EAE4D5] text-[#0a0a0a] font-bold"
                          : "bg-[#B6B09F]/10 text-[#B6B09F] hover:bg-[#B6B09F]/20"
                      }`}
                    >
                      {rpt.reportMonth}
                    </button>
                  ))}
                </div>
              )}

              {activeReportModal.reports.length === 0 ? (
                <div className="text-center py-10 text-[#B6B09F]">
                  No statements filed for this release yet.
                </div>
              ) : (
                (() => {
                  const currentReport =
                    activeReportModal.reports[selectedReportIndex];

                  return (
                    <>
                      {/* Metric Banner */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-white/[0.02] border border-[#B6B09F]/10 rounded-xl">
                        <div>
                          <p className="text-xs text-[#B6B09F]">Monthly Streams</p>
                          <p className="text-lg font-bold text-[#EAE4D5] mt-0.5">
                            {currentReport.totalStreams?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#B6B09F]">Consumption Units</p>
                          <p className="text-lg font-bold text-[#EAE4D5] mt-0.5">
                            {currentReport.totalConsumptionUnits?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#B6B09F]">Total Revenue</p>
                          <p className="text-lg font-bold text-emerald-400 mt-0.5">
                            ${currentReport.totalRevenueUsd?.toFixed(2) || "0.00"}
                          </p>
                        </div>
                      </div>

                      {/* Navigation Tabs */}
                      <div className="flex gap-2 border-b border-[#B6B09F]/10">
                        {["dsp", "channel", "tracks"].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setModalTab(tab)}
                            className={`pb-2 px-1 text-xs font-semibold capitalize border-b-2 transition-colors ${
                              modalTab === tab
                                ? "border-[#EAE4D5] text-[#EAE4D5]"
                                : "border-transparent text-[#B6B09F] hover:text-[#EAE4D5]"
                            }`}
                          >
                            {tab === "dsp" ? "DSP Breakdown" : tab === "channel" ? "Channel Breakdown" : "Tracks"}
                          </button>
                        ))}
                      </div>

                      {/* DSP Breakdown */}
                      {modalTab === "dsp" && (
                        <div className="divide-y divide-[#B6B09F]/10">
                          {currentReport.dspBreakdown?.map((dsp) => (
                            <div
                              key={dsp._id}
                              className="py-3 flex justify-between items-center text-sm"
                            >
                              <span className="font-medium text-[#EAE4D5]">
                                {dsp.dspName}
                              </span>
                              <div className="flex items-center gap-4 text-xs">
                                <span className="text-[#B6B09F]">
                                  {dsp.streams > 0
                                    ? `${dsp.streams.toLocaleString()} streams`
                                    : `${dsp.consumptionUnits.toLocaleString()} units`}
                                </span>
                                <span className="font-bold text-emerald-400 min-w-[60px] text-right">
                                  ${dsp.revenueUsd.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Channel Breakdown */}
                      {modalTab === "channel" && (
                        <div className="divide-y divide-[#B6B09F]/10">
                          {currentReport.channelBreakdown?.map((ch) => (
                            <div
                              key={ch._id}
                              className="py-3 flex justify-between items-center text-sm"
                            >
                              <span className="font-medium text-[#EAE4D5]">
                                {ch.channel}
                              </span>
                              <div className="flex items-center gap-4 text-xs">
                                <span className="text-[#B6B09F]">
                                  {ch.streams > 0
                                    ? `${ch.streams.toLocaleString()} streams`
                                    : `${ch.consumptionUnits.toLocaleString()} units`}
                                </span>
                                <span className="font-bold text-emerald-400 min-w-[60px] text-right">
                                  ${ch.revenueUsd.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Track Breakdown */}
                      {modalTab === "tracks" && (
                        <div className="divide-y divide-[#B6B09F]/10">
                          {currentReport.tracks?.map((trk) => (
                            <div
                              key={trk._id}
                              className="py-3 flex justify-between items-center text-sm"
                            >
                              <div>
                                <p className="font-medium text-[#EAE4D5]">
                                  {trk.title}
                                </p>
                                {trk.isrc && (
                                  <p className="text-[10px] text-[#B6B09F]">
                                    ISRC: {trk.isrc}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs">
                                <span className="text-[#B6B09F]">
                                  {trk.streams > 0
                                    ? `${trk.streams.toLocaleString()} streams`
                                    : `${trk.consumptionUnits.toLocaleString()} units`}
                                </span>
                                <span className="font-bold text-emerald-400 min-w-[60px] text-right">
                                  ${trk.revenueUsd.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReleasesPage;
