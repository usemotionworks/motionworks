import React, { useState } from "react";
import { FaSignature, FaExclamationTriangle, FaLock } from "react-icons/fa";

const AcceptCollabModal = ({ isOpen, onClose, onConfirm, artistName }) => {
  const [terms, setTerms] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="bg-[#0a0a0a] border border-green-500/20 rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-[#EAE4D5] mb-2 flex items-center gap-2">
          <FaSignature className="text-green-500" /> Accept Collaboration
        </h2>
        <p className="text-xs text-[#B6B09F]/60 mb-6 uppercase tracking-widest">
          Agreement with {artistName}
        </p>

        {/* Warning Banner */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-[10px] text-yellow-200/80 leading-relaxed">
              <strong>Safety Warning:</strong> facilitating contact here is
              permitted, but never share passwords or banking details.
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-lg p-3 text-sm focus:border-green-500 outline-none text-[#EAE4D5] h-32 resize-none"
            placeholder="Add specific terms or contact info..."
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
          />

          <div className="flex flex-col gap-3">
            <button
              onClick={() => onConfirm(terms)}
              className="w-full py-4 bg-[#EAE4D5] text-black rounded-lg text-xs uppercase font-bold tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
            >
              <FaLock size={10} /> Digitally Sign & Accept
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-[10px] uppercase font-bold tracking-widest text-[#B6B09F]/40 hover:text-[#B6B09F]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptCollabModal;
