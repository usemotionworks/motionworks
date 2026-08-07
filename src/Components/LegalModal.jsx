import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "../store/useUserStore";
import { FaTimes } from "react-icons/fa";

const LegalModal = ({ isOpen, onClose, onSign, legalName, setLegalName }) => {
  const { user } = useUserStore();

  console.log(user)
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose} // 👈 Click out to close
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()} // 👈 Prevents closing when clicking inside modal
        className="bg-[#0a0a0a] border border-[#B6B09F]/20 p-8 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#B6B09F] hover:text-white transition-colors"
        >
          <FaTimes />
        </button>

        <h2 className="text-2xl font-bold text-[#EAE4D5] mb-2">
          Distribution Agreement
        </h2>
        <p className="text-xs text-[#B6B09F] mb-6">
          Please review the terms of service and royalty structures.
        </p>

        {/* SCROLLABLE TERMS */}
        <div className="flex-1 overflow-y-auto pr-4 mb-6 text-[#B6B09F] text-sm leading-relaxed space-y-4 custom-scrollbar bg-[#050505] p-6 rounded-xl border border-[#B6B09F]/5">
          <h4 className="text-[#EAE4D5] font-bold">1. Royalty Split</h4>
          <p>
            By signing this agreement, you acknowledge that Motion Works will
            retain 20% of net royalties as defined in your specific tier. 80%
            will be remitted to your connected wallet.
          </p>

          <h4 className="text-[#EAE4D5] font-bold">2. Content Ownership</h4>
          <p>
            You confirm all works are original and you own 100% of the
            copyrights or have cleared all necessary licenses for distribution.
            Samples must be cleared prior to submission.
          </p>

          <h4 className="text-[#EAE4D5] font-bold">3. Distribution Rights</h4>
          <p>
            You grant Motion Works the non-exclusive right to distribute your
            content to digital service providers (DSPs) globally.
          </p>
        </div>

        {/* SIGNATURE SECTION */}
        <div className="border-t border-[#B6B09F]/10 pt-6">
          <label className="text-[10px] text-[#B6B09F] mb-2 block uppercase tracking-[0.2em]">
            Type Full Legal Name to Sign
          </label>

          <p className="text-[10px] text-[#B6B09F]/50 mb-3 italic">
            Must match your registered name:{" "}
            <span className="text-[#EAE4D5] font-bold">{user?.legalName}</span>
          </p>

          <input
            type="text"
            placeholder={user?.legalName || "John Doe"}
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-lg px-4 py-4 text-[#EAE4D5] focus:border-[#EAE4D5] outline-none transition-all italic font-serif text-lg"
          />

          <button
            onClick={onSign}
            disabled={
              legalName.trim().toLowerCase() !== user?.legalName?.toLowerCase()
            }
            className="w-full mt-4 bg-[#EAE4D5] text-[#0a0a0a] font-bold py-4 rounded-lg hover:bg-white disabled:opacity-10 transition-all uppercase tracking-widest text-xs"
          >
            I Accept & Bind This Agreement
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LegalModal;
