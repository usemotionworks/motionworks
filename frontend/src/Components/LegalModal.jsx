import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "../store/useUserStore";
import { FaTimes } from "react-icons/fa";
import { distributionTerms } from "../legal/distributionTerms";

const LegalModal = ({ isOpen, onClose, onSign, legalName, setLegalName }) => {
  const { user } = useUserStore();

  const [acceptedTerms, setAcceptedTerms] = React.useState(false);

  const legalNameMatches =
    legalName.trim().toLowerCase() ===
    user?.legalName?.trim().toLowerCase();

  const canSign = legalNameMatches && acceptedTerms;


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
        <div className="flex-1 overflow-y-auto pr-4 mb-6 text-[#B6B09F] text-sm leading-relaxed space-y-6 custom-scrollbar bg-[#050505] p-6 rounded-xl border border-[#B6B09F]/5">
          {distributionTerms.map((section, sectionIndex) => (
            <section key={`${section.heading}-${sectionIndex}`} className="space-y-3">
              <h4 className="text-[#EAE4D5] font-bold">
                {section.heading}
              </h4>

              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
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

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1"
            />
            <span>
              I have read and agree to the MotionWorks Digital Distribution
              Terms and Conditions.
            </span>
          </label>

          <button
            onClick={onSign}
            disabled={!canSign}
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
