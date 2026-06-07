import React from "react";
import { FaPlus, FaTrash, FaCopy } from "react-icons/fa";

const WRITER_ROLES = ["Composer", "Lyricist", "Arranger", "Producer", "Writer"];

const WritersTab = ({ track, onUpdate, onApplyToAll }) => {
  const writers = track.writers || [];

  const addWriter = () => {
    onUpdate("writers", [...writers, { legalName: "", roles: ["Composer"] }]);
  };

  const toggleRole = (index, role) => {
    const updated = writers.map((item, i) => {
      if (i !== index) return item;

      const currentRoles = item.roles || [];
      const newRoles = currentRoles.includes(role)
        ? currentRoles.length > 1
          ? currentRoles.filter((r) => r !== role)
          : currentRoles
        : [...currentRoles, role];

      return { ...item, roles: newRoles };
    });

    onUpdate("writers", updated);
  };

  const updateLegalName = (index, value) => {
    const updated = writers.map((item, i) =>
      i === index ? { ...item, legalName: value } : item,
    );
    onUpdate("writers", updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-[#B6B09F]/10 pb-4">
        <div className="space-y-1">
          <p className="text-[10px] text-[#B6B09F] uppercase tracking-widest font-bold">
            Writers & Publishers
          </p>
          <p className="text-[9px] text-[#B6B09F]/40 italic">
            Use legal names only for royalty collection.
          </p>
        </div>
        <button
          onClick={() => onApplyToAll("writers")}
          className="text-[9px] text-[#B6B09F]/40 hover:text-[#EAE4D5] flex items-center gap-2 uppercase tracking-widest"
        >
          <FaCopy size={10} /> Apply to All
        </button>
      </div>

      <div className="space-y-6">
        {writers.map((writer, idx) => (
          <div
            key={idx}
            className="p-4 bg-[#B6B09F]/5 rounded-lg border border-[#B6B09F]/5 space-y-4"
          >
            <div className="flex-1">
              <label className="text-[9px] text-[#B6B09F]/40 uppercase mb-1 block">
                Legal Full Name
              </label>
              <input
                value={writer.legalName}
                onChange={(e) => updateLegalName(idx, e.target.value)} // <-- CALL IT HERE
                className="w-full bg-transparent border-b border-[#B6B09F]/20 py-2 text-sm text-[#EAE4D5] outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {WRITER_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => toggleRole(idx, role)}
                  className={`px-3 py-1.5 rounded-full text-[9px] uppercase border transition-all ${
                    writer.roles?.includes(role)
                      ? "bg-[#EAE4D5] text-black border-[#EAE4D5]"
                      : "bg-transparent text-[#B6B09F]/40 border-[#B6B09F]/10"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                onUpdate(
                  "writers",
                  writers.filter((_, i) => i !== idx),
                )
              }
              className="md:mt-4 text-red-500/40 hover:text-red-500"
            >
              <FaTrash size={12} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addWriter}
        className="w-full py-4 border border-dashed border-[#B6B09F]/20 text-[#B6B09F]/60 hover:text-[#EAE4D5] hover:border-[#EAE4D5]/40 transition-all rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <FaPlus size={10} /> Add Writer
      </button>
    </div>
  );
};

export default WritersTab;
