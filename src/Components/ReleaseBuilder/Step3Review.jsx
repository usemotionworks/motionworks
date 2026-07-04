import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { FaCheck, FaArrowRight, FaMusic, FaUserCircle } from "react-icons/fa";
import LegalModal from "../LegalModal";
import { useUserStore } from "../../store/useUserStore";

const Step3Review = ({
  releaseData,
  setStep,
  handleSubmit,
  isSubmitting,
  uploadProgress,
  hasSigned,
  setHasSigned,
  legalName,
  setLegalName,
  isLegalModalOpen,
  setIsLegalModalOpen,
}) => {
  const { user } = useUserStore();

  const overallProgress = useMemo(() => {
    if (typeof uploadProgress === "number") return uploadProgress;
    const values = Object.values(uploadProgress || {});
    return values.length
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0;
  }, [uploadProgress]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 pb-24"
      >
        {/* RELEASE SUMMARY CARD */}
        <div className="p-6 bg-[#050505] border border-[#B6B09F]/10 rounded-xl">
          <h2 className="text-xl font-semibold text-[#EAE4D5] border-b border-[#B6B09F]/10 pb-2 mb-4 uppercase tracking-tighter">
            Final Review{" "}
            <span className="text-[#B6B09F]/40 text-xs">
              Remember to add Composer, Lyrics, and Production Credits
            </span>
          </h2>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-32 h-32 bg-[#0a0a0a] rounded-lg overflow-hidden border border-[#B6B09F]/10 flex-shrink-0">
              {releaseData.artwork ? (
                <img
                  src={releaseData.artwork}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#B6B09F]/30 text-xs text-center p-2">
                  No Cover Uploaded
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm flex-1">
              <div>
                <span className="text-[10px] text-[#B6B09F]/40 uppercase font-bold block mb-1">
                  Title
                </span>
                <p className="text-[#EAE4D5] font-medium">
                  {releaseData.title}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#B6B09F]/40 uppercase font-bold block mb-1">
                  Type
                </span>
                <p className="text-[#EAE4D5]">{releaseData.releaseType}</p>
              </div>
              <div>
                <span className="text-[10px] text-[#B6B09F]/40 uppercase font-bold block mb-1">
                  Genre
                </span>
                <p className="text-[#EAE4D5]">{releaseData.genre}</p>
              </div>
              <div>
                <span className="text-[10px] text-[#B6B09F]/40 uppercase font-bold block mb-1">
                  Owner
                </span>
                <p className="text-[#EAE4D5]">{user.stageName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* TRACKLIST & CREDITS SUMMARY */}
        {/* TRACKLIST & CREDITS SUMMARY */}
        <div className="space-y-4">
          <h3 className="text-[10px] text-[#B6B09F] uppercase tracking-widest font-bold px-2">
            Tracklist & Credits
          </h3>
          {releaseData.tracks.map((track, idx) => (
            <div
              key={idx}
              className="p-5 bg-[#0a0a0a] border border-[#B6B09F]/5 rounded-lg"
            >
              {/* Track Header */}
              <div className="flex items-center justify-between mb-4 border-b border-[#B6B09F]/5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-[#B6B09F]/10 flex items-center justify-center text-[10px] text-[#B6B09F] font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="text-[#EAE4D5] font-semibold block leading-none mb-1">
                      {track.title}
                    </span>
                    <span className="text-[10px] text-[#B6B09F]/50 uppercase tracking-tight">
                      {track.primaryArtists}{" "}
                      {track.featuredArtists && `ft. ${track.featuredArtists}`}
                    </span>
                  </div>
                </div>
                <FaMusic className="text-[#B6B09F]/20" size={14} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-2">
                {/* Writers Section */}
                <div>
                  <span className="text-[9px] text-[#B6B09F]/30 uppercase font-bold block mb-2 tracking-wider">
                    Writing Credits
                  </span>
                  <div className="space-y-2">
                    {track.writers?.length > 0 ? (
                      track.writers.map((w, i) => (
                        <div key={i} className="flex flex-col">
                          <span className="text-[12px] text-[#EAE4D5] font-medium">
                            {w.legalName}
                          </span>
                          <span className="text-[10px] text-[#B6B09F]/50 italic">
                            {w.roles?.join(", ") || "No role specified"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[11px] text-red-400/40 italic">
                        No writers listed
                      </span>
                    )}
                  </div>
                </div>

                {/* Additional Credits Section */}
                <div>
                  <span className="text-[9px] text-[#B6B09F]/30 uppercase font-bold block mb-2 tracking-wider">
                    Production & Engineering
                  </span>
                  <div className="space-y-2">
                    {track.additionalCredits?.length > 0 ? (
                      track.additionalCredits.map((c, i) => (
                        <div key={i} className="flex flex-col">
                          <span className="text-[12px] text-[#EAE4D5] font-medium">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-teal-400/60 uppercase text-[9px] font-bold tracking-tighter">
                            {c.roles?.join(" • ") || "Credit"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[11px] text-[#B6B09F]/20 italic">
                        None
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* LEGAL SIGNATURE */}
        <div
          className={`p-4 rounded-lg border transition-all ${hasSigned ? "bg-[#B6B09F]/10 border-[#B6B09F]/30" : "bg-[#0a0a0a] border-[#B6B09F]/10"}`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasSigned}
              onChange={(e) => {
                if (e.target.checked) setIsLegalModalOpen(true);
                else {
                  setHasSigned(false);
                  setLegalName("");
                }
              }}
              className="mt-1 w-4 h-4 appearance-none border border-[#B6B09F]/40 rounded bg-[#0a0a0a] checked:bg-[#EAE4D5] transition-all cursor-pointer"
            />
            <div className="flex-1">
              <span className="text-xs text-[#B6B09F]">
                I confirm that I own or control all rights to this content and
                agree to the{" "}
                <button
                  type="button"
                  onClick={() => setIsLegalModalOpen(true)}
                  className="text-[#EAE4D5] font-bold underline"
                >
                  Royalty & Distribution Agreement
                </button>
                .
              </span>
              {hasSigned && (
                <p className="text-green-400 text-xs italic mt-2 flex items-center gap-1 font-medium">
                  <FaCheck /> Digitally Signed: {legalName}
                </p>
              )}
            </div>
          </label>
        </div>

        {/* ACTIONS */}
        {isSubmitting && (
          <div className="w-full bg-[#B6B09F]/10 h-1 rounded-full overflow-hidden mb-4">
            <div
              className="bg-[#EAE4D5] h-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => setStep(2)}
            disabled={isSubmitting}
            className="flex-1 py-4 border border-[#B6B09F]/20 text-[#B6B09F] font-bold rounded-lg uppercase text-xs"
          >
            Back
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || !hasSigned}
            className={`flex-[2] py-4 rounded-lg font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 ${hasSigned && !isSubmitting ? "bg-[#EAE4D5] text-[#0a0a0a] hover:bg-white" : "bg-[#B6B09F]/10 text-[#B6B09F]/40 cursor-not-allowed"}`}
          >
            {isSubmitting ? `Processing ${overallProgress}%` : "Submit Release"}
            {!isSubmitting && <FaArrowRight />}
          </button>
        </div>
      </motion.div>

      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        legalName={legalName}
        setLegalName={setLegalName}
        onSign={() => {
          setHasSigned(true);
          setIsLegalModalOpen(false);
        }}
      />
    </>
  );
};

export default Step3Review;
