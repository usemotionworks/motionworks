import React from "react";
import { motion } from "framer-motion";
import {
  FaUpload,
  FaInfoCircle,
  FaSave,
  FaArrowRight,
  FaClock,
} from "react-icons/fa";

const Step1General = ({
  data,
  setData,
  onNext,
  onSave,
  artworkProps,
  isSubmitting,
  canProceed,
}) => {
  const { artworkPreview, artworkUploading, handleArtworkUpload } =
    artworkProps;

  // Local handler for input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 14);

  // Format dates to YYYY-MM-DD
  const minDate = today.toISOString().split("T")[0];
  const maxDate = futureDate.toISOString().split("T")[0];

  // Consistent Styling
  const inputStyle =
    "w-full px-4 py-3 bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-lg text-[#EAE4D5] placeholder-[#B6B09F]/40 focus:border-[#EAE4D5] focus:outline-none transition-all duration-300";
  const labelStyle =
    "block text-[#EAE4D5] text-[10px] uppercase tracking-[0.2em] font-bold mb-2 opacity-70";
  const sectionCard =
    "p-6 bg-[#050505] border border-[#B6B09F]/10 rounded-xl space-y-6";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* 1. FORMAT & TITLE */}
      <section className={sectionCard}>
        <div className="flex items-center justify-between border-b border-[#B6B09F]/10 pb-4">
          <h2 className="text-xl font-serif text-[#EAE4D5]">Basic Info</h2>
          <span className="text-[10px] text-[#B6B09F]/50 uppercase tracking-widest">
            Step 1.1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelStyle}>Release Type</label>
            <select
              name="releaseType"
              value={data.releaseType}
              onChange={handleChange}
              className={inputStyle}
            >
              <option value="Single">Single (1-3 Tracks)</option>
              <option value="EP">EP (4-6 Tracks)</option>
              <option value="Album">Album (7+ Tracks)</option>
              <option value="Compilation">Compilation</option>
            </select>
          </div>
          <div>
            <label className={labelStyle}>Release Title</label>
            <input
              type="text"
              name="title"
              value={data.title}
              onChange={handleChange}
              className={inputStyle}
              placeholder="e.g. Midnight Genesis"
            />
          </div>
        </div>
      </section>

      {/* 2. COVER ARTWORK */}
      <section className={sectionCard}>
        <h2 className="text-xl font-serif text-[#EAE4D5] border-b border-[#B6B09F]/10 pb-4">
          Cover Artwork
        </h2>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-56 h-56 bg-[#0a0a0a] border-2 border-dashed border-[#B6B09F]/20 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
            {artworkPreview || data.artwork ? (
              <div className="relative w-full h-full">
                <img
                  src={artworkPreview || data.artwork}
                  alt="Artwork"
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    artworkUploading ? "opacity-30 blur-sm" : "opacity-100"
                  }`}
                />
                {artworkUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#EAE4D5] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-[#B6B09F]/30 group-hover:text-[#B6B09F]/60 transition-colors">
                <FaUpload className="text-3xl mx-auto mb-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Upload Image
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg, image/png"
              onChange={handleArtworkUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={artworkUploading}
            />
          </div>

          <div className="flex-1">
            <div className="bg-[#B6B09F]/5 border border-[#B6B09F]/10 p-5 rounded-lg space-y-3">
              <div className="flex gap-3">
                <FaInfoCircle className="text-[#EAE4D5] mt-1 flex-shrink-0" />
                <div className="text-xs text-[#B6B09F]/80 leading-relaxed">
                  <strong className="text-[#EAE4D5]">Guidelines:</strong>
                  <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>Minimum 3000 x 3000 pixels (Perfect Square).</li>
                    <li>Formats: JPG or PNG only.</li>
                    <li>Less than 10MB</li>
                    <li>No blurry images or social media handles.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SCHEDULE */}
      <section className={sectionCard}>
        <h2 className="text-xl font-serif text-[#EAE4D5] border-b border-[#B6B09F]/10 pb-4">
          Release Schedule
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={labelStyle}>Original Release Date</label>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              name="releaseDate"
              value={data.releaseDate}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>
          <div>
            <label className={labelStyle}>Pre-order (Optional)</label>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              name="preOrderDate"
              value={data.preOrderDate}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>
          <div>
            <label className={labelStyle}>Time Zone Strategy</label>
            <select
              name="timeZone"
              value={data.timeZone}
              onChange={handleChange}
              className={inputStyle}
            >
              <option value="EST">EST (Global Simultaneous)</option>
              <option value="GMT">GMT (Global Simultaneous)</option>
            </select>
          </div>
        </div>
      </section>

      {/* 4. METADATA */}
      <section className={sectionCard}>
        <h2 className="text-xl font-serif text-[#EAE4D5] border-b border-[#B6B09F]/10 pb-4">
          Release Metadata
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelStyle}>Primary Genre</label>
            <input
              type="text"
              name="genre"
              value={data.genre}
              onChange={handleChange}
              className={inputStyle}
              placeholder="Afrobeats"
            />
          </div>
          <div>
            <label className={labelStyle}>Record Label</label>
            <input
              type="text"
              name="label"
              value={data.label}
              onChange={handleChange}
              className={inputStyle}
              placeholder="Independent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div>
            <label className={labelStyle}>© Copyright Line</label>
            <input
              type="text"
              name="cLine"
              value={data.cLine}
              onChange={handleChange}
              className={inputStyle}
              placeholder="2026 NAMP Ltd"
            />
          </div>
          <div>
            <label className={labelStyle}>℗ Phonogram Line</label>
            <input
              type="text"
              name="pLine"
              value={data.pLine}
              onChange={handleChange}
              className={inputStyle}
              placeholder="2026 NAMP Ltd"
            />
          </div>
        </div>

        {/* UPC LOGIC */}
        <div className="pt-6 border-t border-[#B6B09F]/10">
          <label className="flex items-center space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              name="hasUPC"
              checked={data.hasUPC}
              onChange={handleChange}
              className="w-4 h-4 rounded border-[#B6B09F]/30 bg-transparent accent-[#EAE4D5]"
            />
            <span className="text-[#EAE4D5] text-sm font-medium group-hover:text-white transition-colors">
              I already have a UPC/EAN code
            </span>
          </label>

          {data.hasUPC && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4"
            >
              <input
                type="text"
                name="upcCode"
                value={data.upcCode}
                onChange={handleChange}
                className={inputStyle}
                placeholder="Enter 12 or 13 digit code"
              />
            </motion.div>
          )}
        </div>
      </section>

      {/* FOOTER ACTIONS */}
      <footer className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-[#B6B09F]/10">
        <button
          onClick={onSave}
          disabled={isSubmitting || !data.title}
          className="flex items-center gap-2 text-[#B6B09F] hover:text-[#EAE4D5] text-[10px] font-bold uppercase tracking-[0.3em] transition-all disabled:opacity-20"
        >
          <FaSave className="text-xs" /> Save Draft Progress
        </button>

        <button
          onClick={onNext}
          disabled={isSubmitting}
          className="w-full md:w-auto px-12 py-4 bg-[#EAE4D5] text-[#0a0a0a] font-black text-xs uppercase tracking-[0.2em] rounded-full hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl"
        >
          {isSubmitting ? "Processing..." : "Continue to Tracks"}
          {!isSubmitting && <FaArrowRight size={10} />}
        </button>
      </footer>
    </motion.div>
  );
};

export default Step1General;
