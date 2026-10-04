import { useEffect, useState, useCallback } from "react";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaMusic,
  FaLayerGroup,
  FaSave,
  FaPaperPlane,
} from "react-icons/fa";
import { ALLOWED_DSPS, ALLOWED_CHANNELS } from "../../lib/reportExports";


const Reporting = () => {
  // --- 1. STATE MANAGEMENT ---
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingReport, setFetchingReport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Report Tracking
  const [activeReportId, setActiveReportId] = useState(null);
  const [reportStatus, setReportStatus] = useState("new"); // "new", "draft", "submitted"

  // Form Selection State
  const [selectedReleaseId, setSelectedReleaseId] = useState("");
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [reportMonth, setReportMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // Performance Metrics State
  const [trackMetrics, setTrackMetrics] = useState([]);
  const [dspMetrics, setDspMetrics] = useState([
    { dspName: "Spotify", streams: 0, consumptionUnits: 0, revenueUsd: 0 },
  ]);
  const [channelMetrics, setChannelMetrics] = useState([
    { channelName: ALLOWED_CHANNELS[0], streams: 0, consumptionUnits: 0, revenueUsd: 0 },
  ]);

  // --- 2. DATA FETCHING ---
  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const { data } = await axios.get("/api/admin/distributed-releases");
        setReleases(data);
      } catch (error) {
        toast.error("Failed to load releases.");
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

  // Fetch Existing Draft/Report when Release or Month changes
  const checkAndLoadExistingReport = useCallback(async (release, month) => {
    if (!release?._id || !month) return;

    setFetchingReport(true);
    try {
      const { data } = await axios.get(
        `/api/reports/release/${release._id}?month=${month}`
      );

      if (data) {
        setActiveReportId(data._id);
        setReportStatus(data.status);

        if (data.tracks && data.tracks.length > 0) {
          setTrackMetrics(data.tracks);
        }
        if (data.dspBreakdown && data.dspBreakdown.length > 0) {
          setDspMetrics(
            data.dspBreakdown.map((item) => ({
              dspName: item.name || item.dspName,
              streams: item.streams,
              consumptionUnits: item.consumptionUnits,
              revenueUsd: item.revenueUsd,
            }))
          );
        }
        if (data.channelBreakdown && data.channelBreakdown.length > 0) {
          setChannelMetrics(
            data.channelBreakdown.map((item) => ({
              channelName: item.name || item.channelName,
              streams: item.streams,
              consumptionUnits: item.consumptionUnits,
              revenueUsd: item.revenueUsd,
            }))
          );
        }

        toast.success(`Loaded existing ${data.status} for ${month}`);
      }
    } catch (error) {
      // 404 means no draft exists yet for this month - reset to fresh state
      setActiveReportId(null);
      setReportStatus("new");
      resetTrackMetrics(release);
    } finally {
      setFetchingReport(false);
    }
  }, []);

  const resetTrackMetrics = (release) => {
    if (release?.tracks && release.tracks.length > 0) {
      setTrackMetrics(
        release.tracks.map((t) => ({
          trackId: t._id,
          title: t.title,
          isrc: t.isrc || release.isrc || "",
          streams: 0,
          consumptionUnits: 0,
          revenueUsd: 0,
        }))
      );
    } else {
      setTrackMetrics([]);
    }
    setDspMetrics([{ dspName: "Spotify", streams: 0, consumptionUnits: 0, revenueUsd: 0 }]);
    setChannelMetrics([{ channelName: ALLOWED_CHANNELS[0], streams: 0, consumptionUnits: 0, revenueUsd: 0 }]);
  };

  // --- 3. FILTERING LOGIC ---
  const filteredReleases = releases.filter((release) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = release.title?.toLowerCase().includes(query);
    const artistMatch = release.primaryArtists?.some((a) =>
      a.name.toLowerCase().includes(query)
    );
    const labelMatch = release.label?.toLowerCase().includes(query);
    return titleMatch || artistMatch || labelMatch;
  });



  // --- 4. HANDLERS ---
  const handleSelectRelease = (release) => {
    setSelectedReleaseId(release._id);
    setSelectedRelease(release);
    checkAndLoadExistingReport(release, reportMonth);
  };

  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    setReportMonth(newMonth);
    if (selectedRelease) {
      checkAndLoadExistingReport(selectedRelease, newMonth);
    }
  };

  const handleTrackChange = (index, field, value) => {
    const updated = [...trackMetrics];
    updated[index][field] = field === "isrc" || field === "title" ? value : Number(value);
    setTrackMetrics(updated);
  };

  // DSP Handlers
  const handleAddDsp = () => {
    setDspMetrics([
      ...dspMetrics,
      { dspName: ALLOWED_DSPS[0], streams: 0, consumptionUnits: 0, revenueUsd: 0 },
    ]);
  };

  const handleDspChange = (index, field, value) => {
    const updated = [...dspMetrics];
    updated[index][field] = field === "dspName" ? value : Number(value);
    setDspMetrics(updated);
  };

  const handleRemoveDsp = (index) => {
    setDspMetrics(dspMetrics.filter((_, i) => i !== index));
  };

  // Channel Handlers
  const handleAddChannel = () => {
    setChannelMetrics([
      ...channelMetrics,
      { channelName: ALLOWED_CHANNELS[0], streams: 0, consumptionUnits: 0, revenueUsd: 0 },
    ]);
  };

  const handleChannelChange = (index, field, value) => {
    const updated = [...channelMetrics];
    updated[index][field] = field === "channelName" ? value : Number(value);
    setChannelMetrics(updated);
  };

  const handleRemoveChannel = (index) => {
    setChannelMetrics(channelMetrics.filter((_, i) => i !== index));
  };

  // Aggregates
  const totalStreams = trackMetrics.reduce((sum, t) => sum + (t.streams || 0), 0);
  const totalUnits = trackMetrics.reduce((sum, t) => sum + (t.consumptionUnits || 0), 0);
  const totalRevenue = trackMetrics.reduce((sum, t) => sum + (t.revenueUsd || 0), 0);

  // Submit & Save Handler
  const handleSaveReport = async (statusToSave = "draft") => {
    if (!selectedReleaseId || !reportMonth) {
      toast.error("Please select a release and report month.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        reportId: activeReportId,
        releaseId: selectedReleaseId,
        reportMonth,
        status: statusToSave,
        totalStreams,
        totalConsumptionUnits: totalUnits,
        totalRevenueUsd: totalRevenue,
        tracks: trackMetrics,
        dspBreakdown: dspMetrics.map((d) => ({
          dspName: d.dspName || d.name,
          streams: Number(d.streams) || 0,
          consumptionUnits: Number(d.consumptionUnits) || 0,
          revenueUsd: Number(d.revenueUsd) || 0,
        })),
        channelBreakdown: channelMetrics.map((c) => ({
          channel: c.channel || c.channelName || c.name,
          streams: Number(c.streams) || 0,
          consumptionUnits: Number(c.consumptionUnits) || 0,
          revenueUsd: Number(c.revenueUsd) || 0,
        })),
      };

      const { data } = await axios.post("/api/reports", payload);
      setActiveReportId(data.report._id);
      setReportStatus(data.report.status);

      toast.success(
        statusToSave === "draft"
          ? "Report saved as draft!"
          : "Streaming report submitted successfully!"
      );
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-[#B6B09F] animate-pulse">Loading releases...</div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6 text-[#EAE4D5]">
      {/* HEADER & SEARCH SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif text-[#EAE4D5]">Monthly Revenue Reports</h1>
          <p className="text-[#B6B09F] text-sm tracking-wide">
            {filteredReleases.length} DISTRIBUTED RELEASE(S) AVAILABLE
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B6B09F]/30" />
          <input
            type="text"
            placeholder="Search catalog or artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-xl py-3 pl-12 pr-4 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none transition-all placeholder:text-[#B6B09F]/20 text-sm"
          />
        </div>
      </div>

      {/* GRID CATALOG SELECTION */}
      <div className="mb-10">
        <h2 className="text-[#B6B09F] text-xs font-bold uppercase tracking-widest mb-4">
          Step 1: Select Active Release
        </h2>
        {filteredReleases.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[#B6B09F]/10 rounded-2xl">
            <p className="text-[#B6B09F]/40 font-medium">
              No distributed releases matching your criteria.
            </p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredReleases.map((release) => {
                const isSelected = selectedReleaseId === release._id;
                return (
                  <motion.div
                    key={release._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleSelectRelease(release)}
                    className={`bg-[#050505] border rounded-2xl p-4 cursor-pointer transition-all group relative ${
                      isSelected
                        ? "border-[#EAE4D5] bg-[#B6B09F]/5"
                        : "border-[#B6B09F]/10 hover:border-[#B6B09F]/30"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#B6B09F]/5 flex-shrink-0 relative">
                        <img
                          src={release.artwork}
                          alt={release.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="flex-grow min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                          <h3 className="text-base font-bold text-[#EAE4D5] truncate pr-2">
                            {release.title}
                          </h3>
                          {isSelected && (
                            <FaCheckCircle className="text-[#EAE4D5] text-xs flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-[#B6B09F] mt-0.5 truncate">
                          {release.primaryArtists?.map((a) => a.name).join(", ")}
                        </p>
                        <div className="mt-2 flex gap-2 text-[9px] text-[#B6B09F]/50 uppercase tracking-widest">
                          <span>{release.releaseType}</span>
                          <span>•</span>
                          <span>{release.tracks?.length || 0} track(s)</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* STEP 2: METRICS INPUT FORM */}
      {selectedRelease && (
        <div className="space-y-8">
          {/* MONTH & RELEASE BAR */}
          <div className="bg-[#050505] border border-[#B6B09F]/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#B6B09F]/10 text-[#EAE4D5]">
                <FaMusic className="text-lg" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-[#EAE4D5]">
                    {selectedRelease.title}
                  </h2>
                  <span
                    className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                      reportStatus === "draft"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : reportStatus === "submitted"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                    }`}
                  >
                    {fetchingReport ? "Loading..." : reportStatus}
                  </span>
                </div>
                <p className="text-xs text-[#B6B09F]">
                  UPC: {selectedRelease.upc || "N/A"} | Label: {selectedRelease.label}
                </p>
              </div>
            </div>

            <div className="w-full md:w-64">
              <label className="block text-[10px] uppercase tracking-widest text-[#B6B09F] mb-2">
                Reporting Period
              </label>
              <input
                type="month"
                value={reportMonth}
                onChange={handleMonthChange}
                className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-xl py-2.5 px-4 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none transition-all text-sm"
              />
            </div>
          </div>

          {/* TRACK METRICS SECTION */}
          {trackMetrics.length > 0 && (
            <div className="bg-[#050505] border border-[#B6B09F]/10 rounded-2xl p-6">
              <h2 className="text-[#B6B09F] text-xs font-bold uppercase tracking-widest mb-6">
                Step 2: Track Level Metrics
              </h2>
              <div className="space-y-4">
                {trackMetrics.map((track, idx) => (
                  <div
                    key={track.trackId || idx}
                    className="bg-[#B6B09F]/5 border border-[#B6B09F]/10 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#EAE4D5] truncate">
                        {track.title}
                      </p>
                      <p className="text-[10px] text-[#B6B09F]/50 uppercase tracking-wider mt-0.5">
                        ISRC: {track.isrc || "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-[#B6B09F] mb-1">
                        Streams
                      </label>
                      <input
                        type="number"
                        value={track.streams}
                        onChange={(e) => handleTrackChange(idx, "streams", e.target.value)}
                        className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-[#B6B09F] mb-1">
                        Consumption Units
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={track.consumptionUnits}
                        onChange={(e) => handleTrackChange(idx, "consumptionUnits", e.target.value)}
                        className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-[#B6B09F] mb-1">
                        Revenue ($ USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={track.revenueUsd}
                        onChange={(e) => handleTrackChange(idx, "revenueUsd", e.target.value)}
                        className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DSP BREAKDOWN SECTION */}
          <div className="bg-[#050505] border border-[#B6B09F]/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#B6B09F] text-xs font-bold uppercase tracking-widest">
                Step 3: DSP Breakdown
              </h2>
              <button
                type="button"
                onClick={handleAddDsp}
                className="flex items-center gap-2 py-2 px-4 bg-[#B6B09F]/10 hover:bg-[#B6B09F]/20 text-[#EAE4D5] text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors"
              >
                <FaPlus /> Add Store
              </button>
            </div>

            <div className="space-y-3">
              {dspMetrics.map((row, idx) => (
                <div
                  key={idx}
                  className="bg-[#B6B09F]/5 border border-[#B6B09F]/10 rounded-xl p-3 flex flex-wrap md:flex-nowrap gap-3 items-center"
                >
                  <select
                    value={row.dspName}
                    onChange={(e) => handleDspChange(idx, "dspName", e.target.value)}
                    className="w-full md:w-1/3 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none text-sm"
                  >
                    {ALLOWED_DSPS.map((dsp) => (
                      <option key={dsp} value={dsp}>
                        {dsp}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Streams"
                    value={row.streams}
                    onChange={(e) => handleDspChange(idx, "streams", e.target.value)}
                    className="w-full md:w-1/4 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none text-sm"
                  />

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Units"
                    value={row.consumptionUnits}
                    onChange={(e) => handleDspChange(idx, "consumptionUnits", e.target.value)}
                    className="w-full md:w-1/4 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none text-sm"
                  />

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Revenue ($)"
                    value={row.revenueUsd}
                    onChange={(e) => handleDspChange(idx, "revenueUsd", e.target.value)}
                    className="w-full md:w-1/4 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveDsp(idx)}
                    className="text-[#B6B09F]/40 hover:text-red-400 p-2 transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 4: CHANNEL BREAKDOWN SECTION */}
          <div className="bg-[#050505] border border-[#B6B09F]/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <FaLayerGroup className="text-[#B6B09F] text-xs" />
                <h2 className="text-[#B6B09F] text-xs font-bold uppercase tracking-widest">
                  Step 4: Channel Breakdown
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddChannel}
                className="flex items-center gap-2 py-2 px-4 bg-[#B6B09F]/10 hover:bg-[#B6B09F]/20 text-[#EAE4D5] text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors"
              >
                <FaPlus /> Add Channel
              </button>
            </div>

            <div className="space-y-3">
              {channelMetrics.map((row, idx) => (
                <div
                  key={idx}
                  className="bg-[#B6B09F]/5 border border-[#B6B09F]/10 rounded-xl p-3 flex flex-wrap md:flex-nowrap gap-3 items-center"
                >
                  <select
                    value={row.channelName}
                    onChange={(e) => handleChannelChange(idx, "channelName", e.target.value)}
                    className="w-full md:w-1/3 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none text-sm"
                  >
                    {ALLOWED_CHANNELS.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Streams"
                    value={row.streams}
                    onChange={(e) => handleChannelChange(idx, "streams", e.target.value)}
                    className="w-full md:w-1/4 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none text-sm"
                  />

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Units"
                    value={row.consumptionUnits}
                    onChange={(e) => handleChannelChange(idx, "consumptionUnits", e.target.value)}
                    className="w-full md:w-1/4 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none text-sm"
                  />

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Revenue ($)"
                    value={row.revenueUsd}
                    onChange={(e) => handleChannelChange(idx, "revenueUsd", e.target.value)}
                    className="w-full md:w-1/4 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveChannel(idx)}
                    className="text-[#B6B09F]/40 hover:text-red-400 p-2 transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SUBMIT & DRAFT BAR */}
          <div className="bg-[#050505] border border-[#B6B09F]/10 rounded-2xl p-6 flex flex-wrap justify-between items-center gap-6">
            <div>
              <p className="text-[10px] text-[#B6B09F] uppercase tracking-widest">
                Calculated Report Total
              </p>
              <p className="text-3xl font-serif text-[#EAE4D5] mt-1">
                ${totalRevenue.toFixed(2)}
              </p>
              <p className="text-[10px] text-[#B6B09F]/50 uppercase tracking-widest mt-1">
                Total Streams: {totalStreams.toLocaleString()} | Units: {totalUnits.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSaveReport("draft")}
                className="flex items-center gap-2 py-3 px-6 bg-[#B6B09F]/10 hover:bg-[#B6B09F]/20 text-[#EAE4D5] text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50"
              >
                <FaSave /> Save as Draft
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSaveReport("submitted")}
                className="flex items-center gap-2 py-3 px-8 bg-[#EAE4D5] text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-[#fffcf5] disabled:opacity-50 transition-colors"
              >
                <FaPaperPlane /> {submitting ? "Saving..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reporting;
