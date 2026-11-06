import React from "react";

const LyricsTab = ({ track, onUpdate }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <header className="mb-6">
          <h3 className="text-[#EAE4D5] text-sm font-medium tracking-wide">
            Track Lyrics
          </h3>
          <p className="text-[#B6B09F]/50 text-[10px] uppercase tracking-widest mt-1">
            Provide the full lyrics for this track (Optional)
          </p>
        </header>

        <textarea
          className="w-full h-64 bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-xl p-6 text-[#EAE4D5] focus:border-[#EAE4D5] outline-none transition-all font-mono text-sm leading-relaxed custom-scrollbar"
          placeholder="Enter lyrics here..."
          value={track.lyrics || ""}
          onChange={(e) => onUpdate("lyrics", e.target.value)}
        />

        <div className="mt-4 p-4 border border-[#B6B09F]/10 rounded-lg bg-[#0a0a0a]/50">
          <p className="text-[10px] text-[#B6B09F]/40 leading-relaxed italic">
            Tip: Clean formatting helps with distribution to platforms like
            Instagram and Apple Music. Avoid adding headers like [Verse 1] or
            [Chorus] unless they are part of the artistic delivery.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LyricsTab;
