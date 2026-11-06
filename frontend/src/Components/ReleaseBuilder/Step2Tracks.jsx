import React, { useState, useEffect } from "react";
import { motion, Reorder } from "framer-motion";
import {
  FaMusic,
  FaBars,
  FaTrash,
  FaArrowLeft,
  FaArrowRight,
  FaSave,
  FaPlus,
} from "react-icons/fa";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";
import ArtistsTab from "./Step2Tabs/ArtistsTab";
import WritersTab from "./Step2Tabs/WritersTab";
import CreditsTab from "./Step2Tabs/CreditsTab";
import LyricsTab from "./Step2Tabs/LyricsTab";

const Step2Tracks = ({
  data,
  setData,
  onNext,
  onBack,
  onSave,
  isSubmitting,
}) => {
  const [uploadProgress, setUploadProgress] = useState({});
  const [editingTrackIndex, setEditingTrackIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("artists"); // "artists", "writers", "credits", "splits"
  const [showReusableTracks, setShowReusableTracks] = useState(false);
  const [reusableReleases, setReusableReleases] = useState([]);
  const [loadingReusableTracks, setLoadingReusableTracks] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState([]);


  const fetchReusableTracks = async () => {
    setLoadingReusableTracks(true);

    try {
      const { data: response } = await axios.get(
        "/api/releases/reusable-tracks"
      );

      setReusableReleases(response.releases || []);
      setShowReusableTracks(true);
    } catch (error) {
      console.error("Error fetching reusable tracks:", error);
      toast.error(
        error.response?.data?.message ||
          "Unable to load previously released tracks."
      );
    } finally {
      setLoadingReusableTracks(false);
    }
  };

  const toggleTrackSelection = (release, track) => {
    const selectionKey = `${release.releaseId}-${track.trackId}`;

    setSelectedTracks((prev) => {
      const exists = prev.some(
        (item) => item.key === selectionKey
      );

      if (exists) {
        return prev.filter((item) => item.key !== selectionKey);
      }

      return [
        ...prev,
        {
          key: selectionKey,
          release,
          track,
        },
      ];
    });
  };

  const addSelectedTracks = () => {
    if (selectedTracks.length === 0) {
      toast.error("Select at least one track.");
      return;
    }

    const existingSources = new Set(
      data.tracks
        .filter((track) => track.sourceReleaseId && track.sourceTrackId)
        .map(
          (track) =>
            `${track.sourceReleaseId}-${track.sourceTrackId}`
        )
    );

    const tracksToAdd = selectedTracks
      .filter(({ key }) => !existingSources.has(key))
      .map(({ release, track }, index) => ({
        id: `reuse-${release.releaseId}-${track.trackId}`,
        title: track.title,
        trackNumber: data.tracks.length + index + 1,

        // Reuse the existing audio. Do not upload it again.
        file: null,
        fileUrl: track.fileUrl,
        fileKey: track.fileKey,

        isrc: track.isrc || "",
        explicit: track.explicit ?? false,

        primaryArtists: track.primaryArtists || [],
        featuredArtists: track.featuredArtists || [],
        writers: track.writers || [],
        additionalCredits: track.additionalCredits || [],

        // References to the original recording.
        sourceReleaseId: release.releaseId,
        sourceTrackId: track.trackId,

        // Frontend-only flag.
        isReused: true,
      }));

    if (tracksToAdd.length === 0) {
      toast.error("All selected tracks are already in this release.");
      return;
    }

    setData((prev) => ({
      ...prev,
      tracks: [...prev.tracks, ...tracksToAdd],
    }));

    toast.success(
      `${tracksToAdd.length} previously released ${
        tracksToAdd.length === 1 ? "track" : "tracks"
      } added.`
    );

    setSelectedTracks([]);
    setShowReusableTracks(false);
  };

  const uploadTrackAudio = async (trackId, file) => {
    try {
      // 1. GET THE PRESIGNED URL (Send JSON, not FormData)
      const { data: uploadInfo } = await axios.post(
        "/api/releases/get-presigned-url",
        {
          fileName: file.name,
          fileType: file.type,
          releaseTitle: data.title || "untitled",
        },
      );

      const { uploadUrl, fileUrl, fileKey } = uploadInfo;

      // 2. UPLOAD DIRECTLY TO S3
      // Use the uploadUrl from the backend. Note: We use 'file.type' as a header.
      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress((prev) => ({
            ...prev,
            [trackId]: percentCompleted,
          }));
          // If you have a progress state, update it here
        },
      });

      setData((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) =>
          t.id === trackId ? { ...t, fileUrl, fileKey } : t,
        ),
      }));

      toast.success(`${file.name} uploaded successfully!`);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  // Handle file uploads and create track objects

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    const newTracks = files.map((file, index) => {
      // 1. Generate a UNIQUE ID for EACH track inside the loop
      const trackId = `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 2. Initialize progress for this specific ID
      setUploadProgress((prev) => ({ ...prev, [trackId]: 0 }));

      return {
        id: trackId, // Unique to this specific file
        title: file.name.replace(/\.[^/.]+$/, ""),
        trackNumber: data.tracks.length + index + 1,
        file: file,
        isrc: "",
        explicit: false,
        primaryArtists: Array.isArray(data.primaryArtists)
          ? data.primaryArtists
          : [{ name: data.primaryArtists || "Primary Artist", user: null }],
        featuredArtists: [],
        writers: [],
        additionalCredits: [],
        splits: [
          {
            name: data.primaryArtists?.[0]?.name || "Primary Artist",
            role: "Primary",
            percentage: 100,
            // ADD THESE TWO LINES TO FIX THE VALIDATION ERROR:
            category: "Performance",
            creditRole: "Primary Artist",
          },
        ],
      };
    });

    // Update state with the array of unique tracks
    setData((prev) => ({
      ...prev,
      tracks: [...prev.tracks, ...newTracks],
    }));

    // Trigger individual uploads
    newTracks.forEach((track) => {
      uploadTrackAudio(track.id, track.file);
    });
  };

  // Update specific track fields

  const updateTrackMetadata = (field, newValue) => {
    setData((prev) => {
      const updatedTracks = [...prev.tracks];
      updatedTracks[editingTrackIndex] = {
        ...updatedTracks[editingTrackIndex],
        [field]: newValue,
      };
      return { ...prev, tracks: updatedTracks };
    });
  };

  // Remove a track
  // Remove a track using its frontend ID or MongoDB ID
  const removeTrack = (trackToRemove) => {
    setData((prev) => ({
      ...prev,
      tracks: prev.tracks.filter((track) => {
        const trackId = track.id ?? track._id;
        const removedId = trackToRemove.id ?? trackToRemove._id;

        return String(trackId) !== String(removedId);
      }),
    }));
  };

  const isAnyTrackUploading = Object.values(uploadProgress).some(
    (p) => p > 0 && p < 100,
  );

  const applyToAllTracks = (field) => {
    const valueToCopy = data.tracks[editingTrackIndex][field];

    // Ensure we deep copy the array so tracks don't share the same reference
    const clonedValue = JSON.parse(JSON.stringify(valueToCopy));

    setData((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => ({
        ...t,
        [field]: clonedValue,
      })),
    }));
  };

  // Helper to close and reset
  const closeMetadataModal = () => {
    setEditingTrackIndex(null);
    setActiveTab("artists");
  };

  const applyCreditsToAll = () => {
    const currentCredits = data.tracks[editingTrackIndex].additionalCredits;

    // Clone to avoid reference issues
    const clonedCredits = JSON.parse(JSON.stringify(currentCredits));

    setData((prev) => ({
      ...prev,
      tracks: prev.tracks.map((track) => ({
        ...track,
        additionalCredits: clonedCredits,
      })),
    }));

    toast.success("Credits synced across all tracks");
  };

  // Styles inherited from Step 1

  const sectionCard = "p-6 bg-[#050505] border border-[#B6B09F]/10 rounded-xl";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* UPLOAD ZONE */}
      <section className={sectionCard}>
        <div className="flex items-center justify-between border-b border-[#B6B09F]/10 pb-4 mb-6">
          <h2 className="text-xl font-serif text-[#EAE4D5]">Upload Audio</h2>
          <span className="text-[10px] text-[#B6B09F]/50 uppercase tracking-widest">
            Step 2.1
          </span>
        </div>

        <div className="relative border-2 border-dashed border-[#B6B09F]/20 rounded-xl p-12 text-center hover:border-[#EAE4D5]/40 transition-all group bg-[#0a0a0a]/50">
          <input
            type="file"
            multiple
            accept="audio/wav, audio/mpeg, audio/mp3"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileUpload}
          />
          <div className="space-y-4">
            <div className="w-16 h-16 bg-[#B6B09F]/5 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
              <FaMusic className="text-2xl text-[#B6B09F]/40 group-hover:text-[#EAE4D5]" />
            </div>
            <div>
              <p className="text-[#EAE4D5] font-medium tracking-wide">
                Drag & drop master files
              </p>
              <p className="text-[#B6B09F]/50 text-xs mt-2 uppercase tracking-widest">
                WAV (Preferred) or MP3 • Max 200MB
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* PREVIOUSLY RELEASED TRACKS */}
      <section className={sectionCard}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-serif text-[#EAE4D5]">
              Previously Released Tracks
            </h2>
            <p className="text-xs text-[#B6B09F]/50 mt-2">
              Add tracks from your own distributed releases without
              uploading the audio again.
            </p>
          </div>

          <button
            type="button"
            onClick={
              showReusableTracks
                ? () => setShowReusableTracks(false)
                : fetchReusableTracks
            }
            disabled={loadingReusableTracks}
            className="px-6 py-3 border border-[#B6B09F]/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#EAE4D5] hover:border-[#EAE4D5] transition-all disabled:opacity-40"
          >
            {loadingReusableTracks
              ? "Loading..."
              : showReusableTracks
                ? "Close Library"
                : "Browse Previous Tracks"}
          </button>
        </div>

        {showReusableTracks && (
          <div className="mt-6 space-y-6">
            {reusableReleases.length === 0 ? (
              <div className="text-center py-12 border border-[#B6B09F]/10 rounded-xl">
                <FaMusic className="mx-auto text-2xl text-[#B6B09F]/30 mb-3" />
                <p className="text-sm text-[#B6B09F]/60">
                  No previously distributed tracks found.
                </p>
                <p className="text-xs text-[#B6B09F]/30 mt-2">
                  Only your distributed releases are available here.
                </p>
              </div>
            ) : (
              <>
                {reusableReleases.map((release) => (
                  <div
                    key={release.releaseId}
                    className="border border-[#B6B09F]/10 rounded-xl overflow-hidden"
                  >
                    <div className="p-4 bg-[#0a0a0a] border-b border-[#B6B09F]/10">
                      <h3 className="text-sm font-medium text-[#EAE4D5]">
                        {release.releaseTitle}
                      </h3>
                      <p className="text-[10px] text-[#B6B09F]/50 uppercase tracking-widest mt-1">
                        {release.releaseType} • {release.tracks.length}{" "}
                        {release.tracks.length === 1 ? "Track" : "Tracks"}
                      </p>
                    </div>

                    <div className="divide-y divide-[#B6B09F]/10">
                      {release.tracks.map((track) => {
                        const selectionKey =
                          `${release.releaseId}-${track.trackId}`;

                        const isSelected = selectedTracks.some(
                          (item) => item.key === selectionKey
                        );

                        const alreadyAdded = data.tracks.some(
                          (item) =>
                            item.sourceReleaseId?.toString() ===
                              release.releaseId.toString() &&
                            item.sourceTrackId?.toString() ===
                              track.trackId.toString()
                        );

                        return (
                          <label
                            key={selectionKey}
                            className={`flex items-center gap-4 p-4 transition-colors ${
                              alreadyAdded
                                ? "opacity-40 cursor-not-allowed"
                                : "cursor-pointer hover:bg-white/[0.02]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={alreadyAdded}
                              onChange={() =>
                                toggleTrackSelection(release, track)
                              }
                              className="accent-[#EAE4D5] w-4 h-4"
                            />

                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#EAE4D5] truncate">
                                {track.title}
                              </p>
                              <p className="text-[10px] text-[#B6B09F]/40 mt-1">
                                {track.primaryArtists
                                  ?.map((artist) => artist.name)
                                  .join(", ") || "No artist listed"}
                              </p>
                            </div>

                            {alreadyAdded ? (
                              <span className="text-[9px] text-green-400 uppercase tracking-widest">
                                Added
                              </span>
                            ) : (
                              <span className="text-[9px] text-[#B6B09F]/40 uppercase tracking-widest">
                                Reuse
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <span className="text-xs text-[#B6B09F]/60">
                    {selectedTracks.length} selected
                  </span>

                  <button
                    type="button"
                    onClick={addSelectedTracks}
                    disabled={selectedTracks.length === 0}
                    className="w-full sm:w-auto px-8 py-3 bg-[#EAE4D5] text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Add Selected Tracks
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* TRACKLIST */}
      <section className={sectionCard}>
        <div className="flex justify-between items-center mb-6 border-b border-[#B6B09F]/10 pb-4">
          <h2 className="text-xl font-serif text-[#EAE4D5]">Tracklist</h2>
          <span className="text-[10px] text-[#B6B09F] uppercase tracking-[0.2em] bg-[#B6B09F]/5 px-3 py-1 rounded-full border border-[#B6B09F]/10">
            {data.tracks.length} {data.tracks.length === 1 ? "Track" : "Tracks"}
          </span>
        </div>

        {data.tracks.length === 0 ? (
          <div className="text-center py-20 border border-[#B6B09F]/5 rounded-xl bg-[#0a0a0a]/30">
            <p className="text-[#B6B09F]/30 text-xs uppercase tracking-[0.3em]">
              No tracks staged for release
            </p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={data.tracks}
            onReorder={(newOrder) =>
              setData((prev) => ({ ...prev, tracks: newOrder }))
            }
            className="space-y-4"
          >
            {data.tracks.map((track, index) => (
              <Reorder.Item
                key={track.id ?? track._id}
                value={track}
                className="bg-[#0a0a0a] border border-[#B6B09F]/10 rounded-xl p-4 relative group hover:border-[#B6B09F]/30 transition-all"
              >
                <div className="flex items-center gap-6">
                  {/* Drag & Number */}
                  <div className="flex items-center gap-4">
                    <div className="cursor-grab active:cursor-grabbing text-[#B6B09F]/20 hover:text-[#EAE4D5]">
                      <FaBars size={14} />
                    </div>
                    <span className="text-[10px] font-black text-[#B6B09F]/20 w-4">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Title & Progress */}
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[#EAE4D5] text-sm font-medium tracking-wide">
                          {track.title || "Untitled Track"}
                        </h3>

                        {track.isReused && (
                          <span className="text-[8px] uppercase tracking-widest px-2 py-1 rounded-full border border-green-500/30 text-green-400">
                            Previously released
                          </span>
                        )}
                      </div>
                      {!track.isReused &&
                        uploadProgress[track.id] !== undefined &&
                        uploadProgress[track.id] < 100 && (
                        <div className="w-32 h-1 bg-[#B6B09F]/10 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-[#EAE4D5] transition-all duration-300"
                            style={{ width: `${uploadProgress[track.id]}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setEditingTrackIndex(index)} // We'll define this state
                        className="px-4 py-2 border border-[#B6B09F]/20 rounded-full text-[9px] uppercase tracking-[0.2em] text-[#B6B09F] hover:text-[#EAE4D5] hover:border-[#EAE4D5] transition-all"
                      >
                        Edit Track Info
                      </button>

                      <button
                        onClick={() => removeTrack(track)}
                        className="p-2 text-red-500/20 hover:text-red-500 transition-colors"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </section>

      {/* NAVIGATION ACTIONS */}
      <footer className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-[#B6B09F]/10">
        <button
          onClick={onBack}
          className="flex items-center gap-3 text-[#B6B09F] hover:text-[#EAE4D5] text-[10px] font-bold uppercase tracking-[0.3em] transition-all"
        >
          <FaArrowLeft className="text-xs" /> Back to Details
        </button>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={onSave}
            disabled={isSubmitting || data.tracks.length === 0}
            className="flex-1 md:flex-none px-6 py-4 border border-[#B6B09F]/20 text-[#B6B09F] text-[10px] font-bold uppercase tracking-[0.3em] rounded-full hover:bg-[#B6B09F]/5 transition-all disabled:opacity-20"
          >
            Save Draft
          </button>

          <button
            onClick={onNext}
            disabled={
              isSubmitting || data.tracks.length === 0 || isAnyTrackUploading
            }
            className="flex-1 md:flex-none px-12 py-4 bg-[#EAE4D5] text-[#0a0a0a] font-black text-xs uppercase tracking-[0.2em] rounded-full hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl disabled:opacity-20 disabled:grayscale"
          >
            {isAnyTrackUploading ? (
              <span className="flex items-center gap-2">
                Uploading Tracks...{" "}
                <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              </span>
            ) : (
              <>
                Review Release <FaArrowRight size={10} />
              </>
            )}
          </button>
        </div>
      </footer>

      {/* METADATA MODAL */}
      {editingTrackIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={closeMetadataModal}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-[#050505] border border-[#B6B09F]/20 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* HEADER */}
            <header className="p-6 border-b border-[#B6B09F]/10 flex justify-between items-center bg-[#0a0a0a]">
              <div>
                <span className="text-[10px] text-[#B6B09F]/40 uppercase tracking-[0.3em] mb-1 block">
                  Track Metadata — {editingTrackIndex + 1} of{" "}
                  {data.tracks.length}
                </span>
                <h2 className="text-xl font-serif text-[#EAE4D5]">
                  {data.tracks[editingTrackIndex].title || "Untitled Track"}
                </h2>
              </div>
              <button
                onClick={closeMetadataModal}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 text-[#B6B09F] transition-colors"
              >
                <FaPlus className="rotate-45" /> {/* Using FaPlus as an 'X' */}
              </button>
            </header>

            {/* TAB NAVIGATION */}
            <nav className="flex px-6 border-b border-[#B6B09F]/10 bg-[#0a0a0a] overflow-x-auto no-scrollbar">
              {["general", "artists", "writers", "credits", "lyrics"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold border-b-2 transition-all whitespace-nowrap ${
                      activeTab === tab
                        ? "border-[#EAE4D5] text-[#EAE4D5]"
                        : "border-transparent text-[#B6B09F]/30 hover:text-[#B6B09F]"
                    }`}
                  >
                    {tab === "general" && "General Info"}
                    {tab === "artists" && "Artist Roles"}
                    {tab === "writers" && "Writer Roles"}
                    {tab === "credits" && "Additional Credits"}
                    {tab === "lyrics" && "Lyrics"}
                  </button>
                ),
              )}
            </nav>
            {/* DYNAMIC TAB CONTENT */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#050505] custom-scrollbar">
              {activeTab === "general" && (
                <div className="space-y-6 max-w-lg">
                  <div>
                    <label className="text-[10px] text-[#B6B09F]/50 uppercase tracking-widest block mb-2">
                      Track Title
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-lg p-4 text-[#EAE4D5] focus:border-[#EAE4D5] outline-none transition-all"
                      value={data.tracks[editingTrackIndex].title}
                      onChange={(e) =>
                        updateTrackMetadata("title", e.target.value)
                      }
                    />
                  </div>

                  {/* You can also move the EXPLICIT toggle here */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={data.tracks[editingTrackIndex].explicit}
                      onChange={(e) =>
                        updateTrackMetadata("explicit", e.target.checked)
                      }
                    />
                    <label className="text-xs text-[#B6B09F]">
                      Mark as Explicit Content
                    </label>
                  </div>
                </div>
              )}
              {activeTab === "artists" && (
                <ArtistsTab
                  track={data.tracks[editingTrackIndex]}
                  onUpdate={updateTrackMetadata}
                  onApplyToAll={applyToAllTracks}
                />
              )}

              {activeTab === "writers" && (
                <WritersTab
                  track={data.tracks[editingTrackIndex]}
                  onUpdate={updateTrackMetadata}
                  onApplyToAll={applyToAllTracks}
                />
              )}

              {activeTab === "credits" && (
                <CreditsTab
                  track={data.tracks[editingTrackIndex]}
                  onUpdate={updateTrackMetadata}
                  onApplyToAll={applyToAllTracks}
                />
              )}

              {activeTab === "lyrics" && (
                <LyricsTab
                  track={data.tracks[editingTrackIndex]}
                  onUpdate={updateTrackMetadata}
                />
              )}
            </div>

            {/* FOOTER */}
            <footer className="p-6 border-t border-[#B6B09F]/10 bg-[#0a0a0a] flex justify-end">
              <button
                onClick={closeMetadataModal}
                className="px-8 py-3 bg-[#EAE4D5] text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all"
              >
                Confirm Details
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Step2Tracks;
