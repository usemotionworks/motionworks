import React, { useState } from "react";

const RejectionModal = ({ isOpen, onClose, onConfirm, releaseTitle }) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#050505] border border-[#B6B09F]/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6">
          <h2 className="text-xl font-bold text-[#EAE4D5] mb-1">
            Reject Release
          </h2>
          <p className="text-sm text-[#B6B09F] mb-4">
            Providing feedback helps the artist fix issues quickly.
          </p>

          <div className="mb-4">
            <label className="block text-xs uppercase tracking-widest text-[#B6B09F]/60 mb-2 font-semibold">
              Reason for flagging "{releaseTitle}"
            </label>
            <textarea
              autoFocus
              className="w-full bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-lg p-3 text-[#EAE4D5] focus:outline-none focus:border-[#EAE4D5] transition-colors resize-none h-32"
              placeholder="e.g. Artwork contains unauthorized logos, or audio quality is too low..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-grow py-3 text-[#B6B09F] hover:text-[#EAE4D5] transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm(reason);
                setReason("");
              }}
              disabled={!reason.trim()}
              className="flex-grow py-3 bg-red-600/10 border border-red-600/50 text-red-500 font-bold rounded-xl hover:bg-red-600/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectionModal;
