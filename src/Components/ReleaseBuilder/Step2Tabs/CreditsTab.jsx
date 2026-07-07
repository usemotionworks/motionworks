import React, { useState } from "react";
import { FaPlus, FaTrash, FaCopy, FaCheck } from "react-icons/fa";

const COMMON_ROLES = [
  "Producer",
  "Mix Engineer",
  "Mastering Engineer",
  "Recording Engineer",
  "Beatmaker",
  "Vocalist",
  "Guitarist",
  "Bassist",
  "Drummer",
  "Keyboardist",
];

const CreditsTab = ({ track, onUpdate, onApplyToAll }) => {
  const credits = track.additionalCredits || [];
  const [customInputIndex, setCustomInputIndex] = useState(null);
  const [customValue, setCustomValue] = useState("");

  const addRow = () =>
    onUpdate("additionalCredits", [
      ...credits,
      { name: "", roles: ["Producer"] },
    ]);

  const toggleRole = (index, role) => {
    const updated = credits.map((item, i) => {
      if (i !== index) return item;

      const currentRoles = item.roles || [];
      const newRoles = currentRoles.includes(role)
        ? currentRoles.length > 1
          ? currentRoles.filter((r) => r !== role)
          : currentRoles
        : [...currentRoles, role];

      return { ...item, roles: newRoles };
    });

    onUpdate("additionalCredits", updated);
  };

  const updateName = (index, value) => {
    const updated = credits.map((item, i) =>
      i === index ? { ...item, name: value } : item,
    );
    onUpdate("additionalCredits", updated);
  };

  const addCustomRole = (index) => {
    if (!customValue.trim()) return;
    const updated = [...credits];
    const currentRoles = updated[index].roles || [];
    if (!currentRoles.includes(customValue.trim())) {
      updated[index].roles = [...currentRoles, customValue.trim()];
    }
    onUpdate("additionalCredits", updated);
    setCustomValue("");
    setCustomInputIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-[#B6B09F]/10 pb-4">
        <p className="text-[10px] text-[#B6B09F]/50 uppercase tracking-widest">
          Studio & Engineering Credits{" "}
          <span className="text-sm lowercase">(Producer required)</span>
        </p>
        <button
          onClick={() => onApplyToAll("additionalCredits")}
          className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#B6B09F] hover:text-[#EAE4D5]"
        >
          <FaCopy size={10} /> Apply to All
        </button>
      </div>

      <div className="space-y-8">
        {credits.map((item, index) => (
          <div
            key={index}
            className="p-4 bg-[#B6B09F]/5 rounded-xl border border-[#B6B09F]/5 space-y-4"
          >
            <div className="flex justify-between items-end gap-4">
              <div className="flex-1">
                <label className="text-[9px] text-[#B6B09F]/40 uppercase mb-2 block">
                  Contributor Name
                </label>
                <input
                  placeholder="Full Name/Stage Name"
                  value={item.name}
                  onChange={(e) => updateName(index, e.target.value)} // <-- CALL IT HERE
                  className="w-full bg-transparent border-b border-[#B6B09F]/20 py-2 text-sm text-[#EAE4D5] outline-none"
                />
              </div>
              <button
                onClick={() =>
                  onUpdate(
                    "additionalCredits",
                    credits.filter((_, i) => i !== index),
                  )
                }
                className="p-2 text-red-500/30 hover:text-red-500 mb-1"
              >
                <FaTrash size={12} />
              </button>
            </div>

            <div>
              <label className="text-[9px] text-[#B6B09F]/40 uppercase mb-3 block">
                Roles
              </label>
              <div className="flex flex-wrap gap-2">
                {/* Standard Roles */}
                {COMMON_ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => toggleRole(index, role)}
                    className={`px-3 py-1.5 rounded-full text-[9px] uppercase border transition-all ${
                      item.roles?.includes(role)
                        ? "bg-[#EAE4D5] text-black border-[#EAE4D5]"
                        : "bg-transparent text-[#B6B09F]/40 border-[#B6B09F]/10"
                    }`}
                  >
                    {item.roles?.includes(role) && (
                      <FaCheck size={8} className="inline mr-1" />
                    )}{" "}
                    {role}
                  </button>
                ))}

                {/* Custom Roles already added */}
                {item.roles
                  ?.filter((r) => !COMMON_ROLES.includes(r))
                  .map((role) => (
                    <button
                      key={role}
                      onClick={() => toggleRole(index, role)}
                      className="px-3 py-1.5 rounded-full text-[9px] uppercase border bg-[#EAE4D5] text-black border-[#EAE4D5]"
                    >
                      <FaCheck size={8} className="inline mr-1" /> {role}
                    </button>
                  ))}

                {/* "Other" Toggle */}
                {customInputIndex !== index ? (
                  <button
                    onClick={() => setCustomInputIndex(index)}
                    className="px-3 py-1.5 rounded-full text-[9px] uppercase border border-dashed border-[#B6B09F]/40 text-[#B6B09F] hover:border-[#EAE4D5] hover:text-[#EAE4D5]"
                  >
                    + Other
                  </button>
                ) : (
                  <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                    <input
                      autoFocus
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && addCustomRole(index)
                      }
                      placeholder="Type role..."
                      className="bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-full px-3 py-1 text-[9px] text-[#EAE4D5] outline-none focus:border-[#EAE4D5]"
                    />
                    <button
                      onClick={() => addCustomRole(index)}
                      className="text-[#EAE4D5] text-[10px] uppercase font-bold"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setCustomInputIndex(null)}
                      className="text-red-500/50 text-[10px] uppercase font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addRow}
        className="w-full py-4 border border-dashed border-[#B6B09F]/20 text-[#B6B09F]/60 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <FaPlus size={10} /> Add Contributor
      </button>
    </div>
  );
};

export default CreditsTab;
