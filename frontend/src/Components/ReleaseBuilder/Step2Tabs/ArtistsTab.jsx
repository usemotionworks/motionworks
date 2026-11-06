import React from "react";
import { FaPlus, FaTrash, FaCopy, FaUserCircle } from "react-icons/fa";

const ArtistsTab = ({ track, onUpdate, onApplyToAll }) => {
  // Ensure we are always working with arrays of objects

  const primaryArtists = Array.isArray(track.primaryArtists)
    ? track.primaryArtists
    : [];
  const featuredArtists = Array.isArray(track.featuredArtists)
    ? track.featuredArtists
    : [];

  const updateArtistName = (field, index, value) => {
    const list = field === "primaryArtists" ? primaryArtists : featuredArtists;
    const updated = list.map((item, i) =>
      i === index ? { ...item, name: value } : item,
    );
    onUpdate(field, updated);
  };

  const addArtist = (field) => {
    const list = field === "primaryArtists" ? primaryArtists : featuredArtists;
    onUpdate(field, [...list, { name: "", user: null }]);
  };

  const removeArtist = (field, index) => {
    const list = field === "primaryArtists" ? primaryArtists : featuredArtists;
    const updated = list.filter((_, i) => i !== index);
    onUpdate(field, updated);
  };

  return (
    <div className="space-y-8">
      {/* PRIMARY ARTISTS SECTION */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-[#B6B09F]/10 pb-4">
          <div className="space-y-1">
            <p className="text-[10px] text-[#B6B09F] uppercase tracking-widest font-bold">
              Primary Artists
            </p>
            <p className="text-[9px] text-[#B6B09F]/40 italic">
              Main performers on this track.
            </p>
          </div>
          <button
            onClick={() => onApplyToAll("primaryArtists")}
            className="text-[9px] text-[#B6B09F]/40 hover:text-[#EAE4D5] flex items-center gap-2 uppercase tracking-widest"
          >
            <FaCopy size={10} /> Sync Primaries
          </button>
        </div>

        <div className="space-y-3">
          {primaryArtists.map((artist, idx) => (
            <div
              key={`primary-${idx}`}
              className="p-3 bg-[#B6B09F]/5 rounded-lg border border-[#B6B09F]/5 flex items-center gap-4 group"
            >
              <FaUserCircle className="text-[#B6B09F]/20 group-hover:text-[#EAE4D5]/40 transition-colors" />
              <div className="flex-1">
                <input
                  value={artist.name}
                  onChange={(e) =>
                    updateArtistName("primaryArtists", idx, e.target.value)
                  }
                  placeholder="Artist Stage Name"
                  className="w-full bg-transparent border-b border-[#B6B09F]/10 py-1 text-sm text-[#EAE4D5] outline-none focus:border-[#EAE4D5] transition-all"
                />
              </div>
              {primaryArtists.length > 1 && (
                <button
                  onClick={() => removeArtist("primaryArtists", idx)}
                  className="text-red-500/20 hover:text-red-500 transition-colors p-1"
                >
                  <FaTrash size={12} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => addArtist("primaryArtists")}
            className="w-full py-3 border border-dashed border-[#B6B09F]/10 text-[#B6B09F]/40 hover:text-[#EAE4D5] hover:border-[#B6B09F]/30 transition-all rounded-lg text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
          >
            <FaPlus size={8} /> Add Primary Artist
          </button>
        </div>
      </div>

      {/* FEATURED ARTISTS SECTION */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-[#B6B09F]/10 pb-4">
          <div className="space-y-1">
            <p className="text-[10px] text-[#B6B09F] uppercase tracking-widest font-bold">
              Featured Artists
            </p>
            <p className="text-[9px] text-[#B6B09F]/40 italic">
              Guest performers (displayed as "ft.").
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {featuredArtists.map((artist, idx) => (
            <div
              key={`feat-${idx}`}
              className="p-3 bg-[#B6B09F]/5 rounded-lg border border-[#B6B09F]/5 flex items-center gap-4"
            >
              <FaUserCircle className="text-[#B6B09F]/20" />
              <div className="flex-1">
                <input
                  value={artist.name}
                  onChange={(e) =>
                    updateArtistName("featuredArtists", idx, e.target.value)
                  }
                  placeholder="Featured Stage Name"
                  className="w-full bg-transparent border-b border-[#B6B09F]/10 py-1 text-sm text-[#EAE4D5] outline-none focus:border-[#EAE4D5]"
                />
              </div>
              <button
                onClick={() => removeArtist("featuredArtists", idx)}
                className="text-red-500/20 hover:text-red-500 transition-colors p-1"
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={() => addArtist("featuredArtists")}
            className="w-full py-3 border border-dashed border-[#B6B09F]/10 text-[#B6B09F]/40 hover:text-[#EAE4D5] hover:border-[#B6B09F]/30 transition-all rounded-lg text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
          >
            <FaPlus size={8} /> Add Featured Artist
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtistsTab;
