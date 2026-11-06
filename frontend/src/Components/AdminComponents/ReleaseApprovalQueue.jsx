import { useEffect, useState } from "react";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaInfoCircle } from "react-icons/fa";

// Components
import RejectionModal from "../../Components/AdminComponents/RejectionModal";
import ReleaseDetailModal from "../../Components/AdminComponents/ReleaseDetailModal";

const ReleaseApprovalQueue = () => {
  // --- 1. STATE MANAGEMENT ---
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Controls
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);

  // --- 2. DATA FETCHING ---
  const fetchReleases = async () => {
    try {
      const res = await axios.get("/api/admin/releases");
      setReleases(res.data);
    } catch (error) {
      toast.error("Failed to load releases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  // --- 3. ACTION HANDLERS ---
  const handleApprove = async (id) => {
    try {
      await axios.put(`/api/admin/releases/${id}`, { status: "distributed" });
      toast.success("Release approved!");
      setReleases((prev) => prev.filter((r) => r._id !== id));
    } catch (error) {
      toast.error("Failed to approve release.");
    }
  };

  const handleOpenDetails = (release) => {
    setSelectedRelease(release);
    setIsDetailOpen(true);
  };

  const handleOpenReject = (release) => {
    setSelectedRelease(release);
    setIsRejectOpen(true);
  };

  const confirmRejection = async (reason) => {
    try {
      await axios.put(`/api/admin/releases/${selectedRelease._id}`, {
        status: "rejected",
        reason,
      });
      toast.success("Release rejected.");
      setReleases((prev) => prev.filter((r) => r._id !== selectedRelease._id));
      setIsRejectOpen(false);
    } catch (error) {
      toast.error("Failed to reject release.");
    }
  };

  // --- 4. FILTERING LOGIC ---
  const filteredReleases = releases.filter((release) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = release.title?.toLowerCase().includes(query);
    const ownerMatch = release.releaseOwner?.stageName
      ?.toLowerCase()
      .includes(query);
    const artistMatch = release.primaryArtists?.some((a) =>
      a.name.toLowerCase().includes(query),
    );
    return titleMatch || ownerMatch || artistMatch;
  });

  if (loading)
    return (
      <div className="p-10 text-[#B6B09F] animate-pulse">Loading queue...</div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* HEADER & SEARCH SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif text-[#EAE4D5]">Release Queue</h1>
          <p className="text-[#B6B09F] text-sm tracking-wide">
            {filteredReleases.length} PENDING SUBMISSIONS
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B6B09F]/30" />
          <input
            type="text"
            placeholder="Search artists or titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-xl py-3 pl-12 pr-4 text-[#EAE4D5] focus:border-[#B6B09F]/50 outline-none transition-all placeholder:text-[#B6B09F]/20"
          />
        </div>
      </div>

      {/* MODALS */}
      <ReleaseDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        release={selectedRelease}
      />

      <RejectionModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={confirmRejection}
        releaseTitle={selectedRelease?.title}
      />

      {/* GRID LIST */}
      {filteredReleases.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-[#B6B09F]/10 rounded-2xl">
          <p className="text-[#B6B09F]/40 font-medium">
            No releases found matching your criteria.
          </p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredReleases.map((release) => (
              <motion.div
                key={release._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#050505] border border-[#B6B09F]/10 rounded-2xl p-5 hover:border-[#B6B09F]/30 transition-all group"
              >
                <div className="flex gap-5">
                  {/* Artwork Thumbnail - Clickable to open details */}
                  <div
                    onClick={() => handleOpenDetails(release)}
                    className="w-24 h-24 rounded-lg overflow-hidden bg-[#B6B09F]/5 cursor-pointer flex-shrink-0 relative group"
                  >
                    <img
                      src={release.artwork}
                      alt="Cover"
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <FaInfoCircle className="text-white" />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-[#EAE4D5] truncate pr-2">
                        {release.title}
                      </h3>
                      <span className="text-[10px] bg-[#B6B09F]/10 text-[#B6B09F] px-2 py-0.5 rounded uppercase tracking-tighter">
                        {release.releaseType}
                      </span>
                    </div>
                    <p className="text-sm text-[#B6B09F] mt-0.5">
                      {release.primaryArtists?.map((a) => a.name).join(", ")}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-y-1 gap-x-4 text-[10px] text-[#B6B09F]/50 uppercase tracking-widest">
                      <span>Genre: {release.genre}</span>
                      <span>Label: {release.label}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-5 border-t border-[#B6B09F]/5 flex gap-3">
                  <button
                    onClick={() => handleApprove(release._id)}
                    className="flex-grow py-2.5 bg-[#EAE4D5] text-black text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-[#fffcf5] transition-colors"
                  >
                    Approve & Distribute
                  </button>
                  <button
                    onClick={() => handleOpenReject(release)}
                    className="px-6 py-2.5 border border-red-900/30 text-red-500 text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500/5 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default ReleaseApprovalQueue;
