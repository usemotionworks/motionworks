import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";

const ProposeCollabModal = ({
  isOpen,
  onClose,
  artist,
  isSubmitting,
  onSend,
}) => {
  const [formData, setFormData] = useState({
    trackTitle: "",
    proposedSplit: 50,
  });
  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend({ ...formData, audio: selectedFile });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-2xl w-full max-w-md p-8 animate-in zoom-in-95">
        <h2 className="text-xl font-bold text-[#EAE4D5] mb-2">
          Propose Feature
        </h2>
        <p className="text-xs text-[#B6B09F]/50 uppercase tracking-widest mb-6">
          To: {artist?.stageName}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#B6B09F] block mb-2">
              Track Title
            </label>
            <input
              required
              type="text"
              className="w-full bg-[#050505] border border-[#B6B09F]/20 rounded-lg p-3 text-sm focus:border-[#EAE4D5] outline-none text-white"
              placeholder="e.g. Midnight Sun"
              value={formData.trackTitle}
              onChange={(e) =>
                setFormData({ ...formData, trackTitle: e.target.value })
              }
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] uppercase tracking-widest text-[#B6B09F]">
                Proposed Split
              </label>
              <span className="text-[#EAE4D5] font-bold">
                {formData.proposedSplit}%
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="99"
              className="w-full accent-[#EAE4D5]"
              value={formData.proposedSplit}
              onChange={(e) =>
                setFormData({ ...formData, proposedSplit: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#B6B09F] block mb-2">
              Audio Snippet
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="hidden"
              id="snippet-upload"
            />
            <label
              htmlFor="snippet-upload"
              className="flex items-center justify-center gap-3 w-full bg-[#050505] border border-dashed border-[#B6B09F]/20 rounded-lg p-4 text-sm text-[#B6B09F] cursor-pointer hover:border-[#EAE4D5] transition-all"
            >
              <FaPlus className="text-xs" />
              {selectedFile ? selectedFile.name : "Select Audio File"}
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-[#B6B09F]/20 rounded-lg text-xs uppercase font-bold tracking-widest text-[#B6B09F]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-[#EAE4D5] text-black rounded-lg text-xs uppercase font-bold tracking-widest hover:bg-white disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposeCollabModal;
