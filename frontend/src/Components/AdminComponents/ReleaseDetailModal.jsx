import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaMusic,
  FaUser,
  FaCalendar,
  FaGlobe,
  FaBalanceScale,
} from "react-icons/fa";

const ReleaseDetailModal = ({ isOpen, onClose, release }) => {
  if (!release) return null;

  const sectionLabel =
    "text-[10px] uppercase tracking-[0.2em] text-[#B6B09F] mb-2 block";
  const infoText = "text-[#EAE4D5] font-medium";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#B6B09F]/10 flex justify-between items-center bg-[#050505]">
              <div>
                <h2 className="text-2xl font-serif text-[#EAE4D5]">
                  {release.title}
                </h2>
                <p className="text-xs text-[#B6B09F] uppercase tracking-widest mt-1">
                  {release.releaseType} • {release.genre}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#B6B09F]/10 rounded-full transition-colors text-[#B6B09F]"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {/* Top Section: Artwork & General Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="aspect-square bg-[#B6B09F]/5 rounded-xl overflow-hidden border border-[#B6B09F]/10">
                  <img
                    src={release.artwork}
                    alt={release.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="md:col-span-2 grid grid-cols-2 gap-6">
                  <div>
                    <span className={sectionLabel}>Primary Artist(s)</span>
                    <p className={infoText}>
                      {release.primaryArtists?.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                  <div>
                    <span className={sectionLabel}>Featured Artist(s)</span>
                    <p className={infoText}>
                      {release.featuredArtists?.map((a) => a.name).join(", ") ||
                        "None"}
                    </p>
                  </div>
                  <div>
                    <span className={sectionLabel}>Release Date</span>
                    <p className={infoText}>
                      {new Date(
                        release.releaseDate?.$date || release.releaseDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className={sectionLabel}>Label</span>
                    <p className={infoText}>{release.label}</p>
                  </div>
                  <div>
                    <span className={sectionLabel}>P-Line</span>
                    <p className="text-xs text-[#B6B09F]">{release.pLine}</p>
                  </div>
                  <div>
                    <span className={sectionLabel}>C-Line</span>
                    <p className="text-xs text-[#B6B09F]">{release.cLine}</p>
                  </div>
                </div>
              </div>

              {/* Tracks Section */}
              <div>
                <h3 className="text-lg font-serif text-[#EAE4D5] mb-6 flex items-center gap-3">
                  <FaMusic className="text-[#B6B09F] text-sm" /> Tracklist
                </h3>
                <div className="space-y-4">
                  {release.tracks.map((track, idx) => (
                    <div
                      key={idx}
                      className="bg-[#050505] border border-[#B6B09F]/10 rounded-xl p-6"
                    >
                      {/* Header: Title & Player */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#B6B09F]/5">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-[#B6B09F]/20">
                            {String(track.trackNumber).padStart(2, "0")}
                          </span>
                          <div>
                            <p className="text-[#EAE4D5] font-medium text-lg">
                              {track.title}
                            </p>
                            <p className="text-[10px] text-[#B6B09F] uppercase tracking-wider">
                              ISRC: {track.isrc || "Auto-assign"} |{" "}
                              {track.explicit ? "Explicit" : "Clean"}
                            </p>
                          </div>
                        </div>

                        {/* Direct SRC fix for Pre-signed URLs */}
                        <audio
                          controls
                          src={track.fileUrl}
                          className="h-8 opacity-70 hover:opacity-100 transition-opacity w-full md:w-64"
                        />
                      </div>

                      {/* Detailed Metadata Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                        {/* Writers Column */}
                        <div>
                          <span className="text-[9px] uppercase tracking-[0.2em] text-[#B6B09F]/50 block mb-3">
                            Writers & Publishing
                          </span>
                          <div className="space-y-3">
                            {track.writers?.map((writer, wIdx) => (
                              <div key={wIdx} className="text-sm">
                                <p className="text-[#EAE4D5]">
                                  {writer.legalName}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {writer.roles.map((role, rIdx) => (
                                    <span
                                      key={rIdx}
                                      className="text-[8px] bg-[#B6B09F]/10 text-[#B6B09F] px-1.5 py-0.5 rounded uppercase tracking-tighter"
                                    >
                                      {role}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Additional Credits Column */}
                        <div>
                          <span className="text-[9px] uppercase tracking-[0.2em] text-[#B6B09F]/50 block mb-3">
                            Production & Engineering
                          </span>
                          <div className="space-y-3">
                            {track.additionalCredits?.length > 0 ? (
                              track.additionalCredits.map((credit, cIdx) => (
                                <div key={cIdx} className="text-sm">
                                  <p className="text-[#EAE4D5]">
                                    {credit.name}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {credit.roles.map((role, rIdx) => (
                                      <span
                                        key={rIdx}
                                        className="text-[8px] bg-blue-500/10 text-blue-400/80 px-1.5 py-0.5 rounded uppercase tracking-tighter"
                                      >
                                        {role}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-[#B6B09F]/30 text-xs italic">
                                No additional credits provided
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal Info */}
              <div className="bg-[#B6B09F]/5 p-6 rounded-xl border border-[#B6B09F]/10">
                <h3 className="text-sm font-bold text-[#EAE4D5] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FaBalanceScale /> Legal Consent
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <p className="text-[#B6B09F]">
                    Signed By:{" "}
                    <span className="text-[#EAE4D5]">
                      {release.legalConsent.signedName}
                    </span>
                  </p>
                  <p className="text-[#B6B09F]">
                    IP Address:{" "}
                    <span className="text-[#EAE4D5]">
                      {release.legalConsent.ipAddress}
                    </span>
                  </p>
                  <p className="text-[#B6B09F]">
                    Agreed At:{" "}
                    <span className="text-[#EAE4D5]">
                      {new Date(
                        release.legalConsent.agreedAt?.$date ||
                          release.legalConsent.agreedAt,
                      ).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-[#B6B09F]">
                    Terms Version:{" "}
                    <span className="text-[#EAE4D5]">
                      {release.legalConsent.version}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-[#B6B09F]/10 bg-[#050505] flex justify-end gap-4">
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-full border border-[#B6B09F]/20 text-[#B6B09F] text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
              >
                Close Review
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReleaseDetailModal;
