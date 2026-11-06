import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";

const ResponseCollabModal = ({ isOpen, onClose, onConfirm, actionType }) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="bg-[#0a0a0a] border border-red-500/20 rounded-2xl w-full max-w-sm p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-[#EAE4D5] mb-2 flex items-center gap-2">
          <FaTimes className="text-red-500" /> Decline Proposal
        </h2>
        <p className="text-xs text-[#B6B09F]/60 mb-6 uppercase tracking-widest">
          Provide feedback for the artist
        </p>

        <div className="space-y-4">
          <textarea
            className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-lg p-3 text-sm focus:border-red-500 outline-none text-[#EAE4D5] h-24 resize-none"
            placeholder="e.g. Schedule is full, not my style, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-[#B6B09F]/10 rounded-lg text-xs uppercase font-bold tracking-widest text-[#B6B09F]"
            >
              Go Back
            </button>
            <button
              onClick={() => onConfirm(reason)}
              className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg text-xs uppercase font-bold tracking-widest hover:bg-red-600 transition-colors"
            >
              Confirm Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseCollabModal;
