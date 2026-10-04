import { useEffect, useState } from "react";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaEdit,
  FaCalendarAlt,
  FaMusic,
  FaSave,
  FaPaperPlane,
  FaTimes,
  FaPlus,
  FaTrash,
  FaFilter,
} from "react-icons/fa";
import { ALLOWED_DSPS, ALLOWED_CHANNELS } from "../../lib/reportExports";


const ManageReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Editing Modal State
  const [editingReport, setEditingReport] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Editable fields inside modal
  const [trackMetrics, setTrackMetrics] = useState([]);
  const [dspMetrics, setDspMetrics] = useState([]);
  const [channelMetrics, setChannelMetrics] = useState([]);

  // Fetch Reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/reports");


      // Safety check: ensure response data is actually an Array
      if (Array.isArray(data)) {
        setReports(data);
      } else {
        setReports([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load reports.");
      setReports([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
      fetchReports();
    }, []);


  // Filter Logic: Search by Release Title, Artist, Track Title, or Month
  const filteredReports = Array.isArray(reports)
    ? reports.filter((report) => {
        const query = searchQuery.toLowerCase();
        const releaseTitle = report.releaseId?.title?.toLowerCase() || "";
        const artistName =
          report.releaseId?.primaryArtists?.map((a) => a.name).join(" ").toLowerCase() || "";
        const month = report.reportMonth?.toLowerCase() || "";

        const trackMatch = report.tracks?.some((t) =>
          t.title?.toLowerCase().includes(query)
        );

        const matchesSearch =
          releaseTitle.includes(query) ||
          artistName.includes(query) ||
          month.includes(query) ||
          trackMatch;

        const matchesStatus =
          statusFilter === "all" ? true : report.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
    : [];

  // Open Edit Drawer
  const handleOpenEdit = (report) => {
    setEditingReport(report);
    setTrackMetrics(report.tracks || []);
    setDspMetrics(
      report.dspBreakdown?.map((item) => ({
        dspName: item.name || item.dspName,
        streams: item.streams,
        consumptionUnits: item.consumptionUnits,
        revenueUsd: item.revenueUsd,
      })) || []
    );
    setChannelMetrics(
      report.channelBreakdown?.map((item) => ({
        channel: item.name || item.channel,
        streams: item.streams,
        consumptionUnits: item.consumptionUnits,
        revenueUsd: item.revenueUsd,
      })) || []
    );
  };

  const handleCloseEdit = () => {
    setEditingReport(null);
  };

  // Field Updates inside Modal
  const handleTrackChange = (index, field, value) => {
    const updated = [...trackMetrics];
    updated[index][field] = field === "title" || field === "isrc" ? value : Number(value);
    setTrackMetrics(updated);
  };

  const handleDspChange = (index, field, value) => {
    const updated = [...dspMetrics];
    updated[index][field] = field === "dspName" ? value : Number(value);
    setDspMetrics(updated);
  };

  const handleRemoveDsp = (index) => {
    setDspMetrics(dspMetrics.filter((_, i) => i !== index));
  };

  const handleAddDsp = () => {
    setDspMetrics([
      ...dspMetrics,
      { dspName: ALLOWED_DSPS[0], streams: 0, consumptionUnits: 0, revenueUsd: 0 },
    ]);
  };

  const handleChannelChange = (index, field, value) => {
    const updated = [...channelMetrics];
    updated[index][field] = field === "channel" ? value : Number(value);
    setChannelMetrics(updated);
  };

  const handleRemoveChannel = (index) => {
    setChannelMetrics(channelMetrics.filter((_, i) => i !== index));
  };

  const handleAddChannel = () => {
    setChannelMetrics([
      ...channelMetrics,
      { channel: ALLOWED_CHANNELS[0], streams: 0, consumptionUnits: 0, revenueUsd: 0 },
    ]);
  };

  // Save Updated Report
  const handleSaveReport = async (statusToSave) => {
    if (!editingReport) return;

    setSubmitting(true);
    try {
      const calculatedRevenue = trackMetrics.reduce((acc, t) => acc + (t.revenueUsd || 0), 0);
      const calculatedStreams = trackMetrics.reduce((acc, t) => acc + (t.streams || 0), 0);
      const calculatedUnits = trackMetrics.reduce((acc, t) => acc + (t.consumptionUnits || 0), 0);

      const payload = {
        reportId: editingReport._id,
        releaseId: editingReport.releaseId._id || editingReport.releaseId,
        reportMonth: editingReport.reportMonth,
        status: statusToSave,
        totalStreams: calculatedStreams,
        totalConsumptionUnits: calculatedUnits,
        totalRevenueUsd: calculatedRevenue,
        tracks: trackMetrics,
        dspBreakdown: dspMetrics.map((d) => ({
          dspName: d.dspName || d.name,
          streams: d.streams,
          consumptionUnits: d.consumptionUnits,
          revenueUsd: d.revenueUsd,
        })),
        channelBreakdown: channelMetrics.map((c) => ({
          channel: c.channel || c.channelName || c.name, // Key must map to 'channel'
          streams: c.streams,
          consumptionUnits: c.consumptionUnits,
          revenueUsd: c.revenueUsd,
        })),
      };


      await axios.post("/api/reports", payload);
      toast.success(
        statusToSave === "draft"
          ? "Draft updated successfully!"
          : "Report published successfully!"
      );

      handleCloseEdit();
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 text-[#EAE4D5]">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif text-[#EAE4D5]">Manage Revenue Reports</h1>
          <p className="text-[#B6B09F] text-sm tracking-wide">
            SEARCH, FILTER AND EDIT CATALOG REPORT DRAFTS & SUBMISSIONS
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Status Filter */}
          <div className="relative w-full sm:w-44">
            <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B6B09F]/30 text-xs" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-xl py-3 pl-10 pr-4 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none text-sm appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Drafts Only</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B6B09F]/30" />
            <input
              type="text"
              placeholder="Search release, track title, ISRC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-xl py-3 pl-12 pr-4 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none transition-all placeholder:text-[#B6B09F]/20 text-sm"
            />
          </div>
        </div>
      </div>

      {/* REPORT LIST TABLE / GRID */}
      {loading ? (
        <div className="p-10 text-[#B6B09F] animate-pulse text-center">
          Loading report catalog...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-[#B6B09F]/10 rounded-2xl">
          <p className="text-[#B6B09F]/40 font-medium">No reports matched your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report._id}
              className="bg-[#050505] border border-[#B6B09F]/10 hover:border-[#B6B09F]/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all"
            >
              {/* Release details */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#B6B09F]/5 flex-shrink-0">
                  <img
                    src={report.releaseId?.artwork || "/placeholder.jpg"}
                    alt={report.releaseId?.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-[#EAE4D5]">
                      {report.releaseId?.title || "Unknown Release"}
                    </h3>
                    <span
                      className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                        report.status === "draft"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#B6B09F] mt-0.5">
                    {report.releaseId?.primaryArtists?.map((a) => a.name).join(", ")}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-[#B6B09F]/60">
                    <span className="flex items-center gap-1">
                      <FaCalendarAlt className="text-[#B6B09F]/30" /> Period: {report.reportMonth}
                    </span>
                    <span>•</span>
                    <span>{report.tracks?.length || 0} Track(s)</span>
                  </div>
                </div>
              </div>

              {/* Aggregates & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 border-[#B6B09F]/10 pt-4 md:pt-0">
                <div className="text-left md:text-right">
                  <p className="text-xs text-[#B6B09F]/50 uppercase tracking-widest">Revenue</p>
                  <p className="text-lg font-serif text-[#EAE4D5]">
                    ${(report.totalRevenueUsd || 0).toFixed(2)}
                  </p>
                  {/* <p className="text-[10px] text-[#B6B09F]/40 mt-0.5">
                    {(report.totalStreams || 0).toLocaleString()} streams
                  </p>*/}
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(report)}
                  className="flex items-center gap-2 py-2.5 px-5 bg-[#B6B09F]/10 hover:bg-[#B6B09F]/20 text-[#EAE4D5] text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                >
                  <FaEdit /> Edit Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL / DRAWER */}
      <AnimatePresence>
        {editingReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#050505] border border-[#B6B09F]/20 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 text-[#EAE4D5] my-8 shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-[#B6B09F]/10 pb-4 mb-6 sticky top-0 bg-[#050505] z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#B6B09F]/10 rounded-xl">
                    <FaMusic className="text-[#EAE4D5]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif text-[#EAE4D5]">
                      Edit Report: {editingReport.releaseId?.title}
                    </h2>
                    <p className="text-xs text-[#B6B09F]">
                      Period: {editingReport.reportMonth} | Current Status: {editingReport.status}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseEdit}
                  className="p-2 text-[#B6B09F] hover:text-white rounded-lg transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              {/* TRACK LEVEL EDITING */}
              <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#B6B09F] mb-4">
                  Track Level Breakdown
                </h3>
                <div className="space-y-3">
                  {trackMetrics.map((track, idx) => (
                    <div
                      key={idx}
                      className="bg-[#B6B09F]/5 border border-[#B6B09F]/10 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center"
                    >
                      <div>
                        <p className="text-sm font-bold text-[#EAE4D5] truncate">{track.title}</p>
                        <p className="text-[10px] text-[#B6B09F]/50">ISRC: {track.isrc || "N/A"}</p>
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-widest text-[#B6B09F] mb-1">
                          Streams
                        </label>
                        <input
                          type="number"
                          value={track.streams}
                          onChange={(e) => handleTrackChange(idx, "streams", e.target.value)}
                          className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-sm text-[#EAE4D5]"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-widest text-[#B6B09F] mb-1">
                          Units
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={track.consumptionUnits}
                          onChange={(e) => handleTrackChange(idx, "consumptionUnits", e.target.value)}
                          className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-sm text-[#EAE4D5]"
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
                          className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-sm text-[#EAE4D5]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DSP BREAKDOWN EDITING */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#B6B09F]">
                    DSP Breakdown
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddDsp}
                    className="flex items-center gap-1 py-1.5 px-3 bg-[#B6B09F]/10 hover:bg-[#B6B09F]/20 text-[#EAE4D5] text-[10px] font-bold rounded-lg"
                  >
                    <FaPlus /> Add DSP
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
                        className="w-full md:w-1/3 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-sm text-[#EAE4D5]"
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
                        className="w-full md:w-1/4 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-sm text-[#EAE4D5]"
                      />

                      <input
                        type="number"
                        step="0.01"
                        placeholder="Units"
                        value={row.consumptionUnits}
                        onChange={(e) => handleDspChange(idx, "consumptionUnits", e.target.value)}
                        className="w-full md:w-1/4 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-sm text-[#EAE4D5]"
                      />

                      <input
                        type="number"
                        step="0.01"
                        placeholder="Revenue ($)"
                        value={row.revenueUsd}
                        onChange={(e) => handleDspChange(idx, "revenueUsd", e.target.value)}
                        className="w-full md:w-1/4 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-sm text-[#EAE4D5]"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveDsp(idx)}
                        className="text-[#B6B09F]/40 hover:text-red-400 p-2"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* CHANNEL BREAKDOWN EDITING */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#B6B09F]">
                    Channel Breakdown
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddChannel}
                    className="flex items-center gap-1 py-1.5 px-3 bg-[#B6B09F]/10 hover:bg-[#B6B09F]/20 text-[#EAE4D5] text-[10px] font-bold rounded-lg"
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
                        value={row.channel}
                        onChange={(e) => handleChannelChange(idx, "channel", e.target.value)}
                        className="w-full md:w-1/3 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-sm text-[#EAE4D5]"
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
                        className="w-full md:w-1/4 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-sm text-[#EAE4D5]"
                      />

                      <input
                        type="number"
                        step="0.01"
                        placeholder="Units"
                        value={row.consumptionUnits}
                        onChange={(e) => handleChannelChange(idx, "consumptionUnits", e.target.value)}
                        className="w-full md:w-1/4 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-sm text-[#EAE4D5]"
                      />

                      <input
                        type="number"
                        step="0.01"
                        placeholder="Revenue ($)"
                        value={row.revenueUsd}
                        onChange={(e) => handleChannelChange(idx, "revenueUsd", e.target.value)}
                        className="w-full md:w-1/4 bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 px-3 text-sm text-[#EAE4D5]"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveChannel(idx)}
                        className="text-[#B6B09F]/40 hover:text-red-400 p-2"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* MODAL ACTIONS */}
              <div className="flex justify-end gap-4 border-t border-[#B6B09F]/10 pt-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveReport("draft")}
                  className="flex items-center gap-2 py-3 px-6 bg-[#B6B09F]/10 hover:bg-[#B6B09F]/20 text-[#EAE4D5] text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                >
                  <FaSave /> Save Draft
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveReport("submitted")}
                  className="flex items-center gap-2 py-3 px-8 bg-[#EAE4D5] text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-colors"
                >
                  <FaPaperPlane /> {submitting ? "Saving..." : "Publish Report"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageReports;
