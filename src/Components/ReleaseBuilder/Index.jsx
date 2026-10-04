import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";
import { FaClock, FaSave } from "react-icons/fa";
import { useUserStore } from "../../store/useUserStore";

// Components
import ProgressSidebar from "./ProgressSidebar";
import Step1General from "./Step1General";
import Step2Tracks from "./Step2Tracks";
import Step3Review from "./Step3Review";

const ReleaseBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();

  // --- 1. STATE MANAGEMENT ---
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(!!id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedReleaseId, setSavedReleaseId] = useState(id || null);
  const [lastSaved, setLastSaved] = useState(null);

  const [artworkPreview, setArtworkPreview] = useState(null);
  const [artworkUploading, setArtworkUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [hasSigned, setHasSigned] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);


  const [releaseData, setReleaseData] = useState({
    releaseType: "Single",
    title: "",
    artwork: null,
    releaseDate: "",
    preOrderDate: "",
    timeZone: "Local Time",
    genre: "",
    label: "",
    language: "English",
    cLine: "",
    pLine: "",
    hasUPC: false,
    upcCode: "",
    tracks: [],
  });

  const validateArtwork = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const width = img.width;
          const height = img.height;

          if (width !== height) {
            reject("Artwork must be a perfect square.");
          } else if (width < 3000 || height < 3000) {
            reject("Artwork must be at least 3000 x 3000 pixels.");
          } else {
            resolve(true);
          }
        };
      };
    });
  };

  // In your NewRelease component
  useEffect(() => {
    // Only prefill if we are creating a BRAND NEW release (no savedReleaseId)
    if (user && !savedReleaseId) {
      setReleaseData((prev) => ({
        ...prev,
        primaryArtists: user.stageName || "", // Use their artist name
        label: user.labelName || "Independent",
        pLine: `℗ ${new Date().getFullYear()} ${user.legalName || user.fullName}`,
        cLine: `© ${new Date().getFullYear()} ${user.legalName || user.fullName}`,
      }));
    }
  }, [user, savedReleaseId]);
  // --- 2. DATA FETCHING (Draft Recovery) ---
  useEffect(() => {
    if (id) {
      const fetchReleaseData = async () => {
        try {
          const { data } = await axios.get(`/api/releases/${id}`);
          setReleaseData({
            ...data,
            primaryArtists:
              data.primaryArtists?.map((a) => a.name).join(", ") || "",
            featuredArtists:
              data.featuredArtists?.map((a) => a.name).join(", ") || "",
            releaseDate: data.releaseDate ? data.releaseDate.split("T")[0] : "",
            preOrderDate: data.preOrderDate
              ? data.preOrderDate.split("T")[0]
              : "",
            tracks: data.tracks.map((t) => ({
              ...t,
              primaryArtists:
                t.primaryArtists?.map((a) => a.name).join(", ") || "",
              featuredArtists:
                t.featuredArtists?.map((a) => a.name).join(", ") || "",
            })),
          });
          setArtworkPreview(data.artwork);
          setSavedReleaseId(data._id);
        } catch (error) {
          toast.error("Failed to load draft.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchReleaseData();
    }
  }, [id]);

  // --- 3. LOGIC HANDLERS ---
  const handleArtworkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Immediate Size Check (Save data/memory)
    if (file.size > 10 * 1024 * 1024) return toast.error("Max size 10MB");

    try {
      // 2. Async Dimension Validation (3000x3000 check)
      await validateArtwork(file);

      // 3. Local Preview (Great UX, feels instant)
      setArtworkPreview(URL.createObjectURL(file));

      // 4. Server Upload
      const formData = new FormData();
      formData.append("artwork", file);
      formData.append("releaseTitle", releaseData.title || "untitled");

      setArtworkUploading(true);
      const { data } = await axios.post(
        "/api/releases/release-artwork",
        formData,
      );

      setReleaseData((prev) => ({ ...prev, artwork: data.imageUrl }));
      toast.success("Artwork verified and ready");
    } catch (error) {
      toast.error(error || "Upload failed");
    } finally {
      setArtworkUploading(false);
    }
  };

  /**
   * 1. PERSISTENT DRAFT SAVE
   * This is a "silent" save. It updates the database without moving the user.
   * Useful for the "Save Draft" button.
   */

  const saveData = async (isDraftStatus, customData = null) => {
    setIsSubmitting(true);
    const dataToSend = customData || releaseData;

    if (!isDraftStatus && !dataToSend.title) {
      toast.error("Please enter a title for your release.");
      setIsSubmitting(false);
      return false;
    }

    // Helper to force anything into a clean array of strings for the DB
    const cleanArtists = (val) => {
      if (typeof val === "string")
        return val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      if (Array.isArray(val))
        return val.map((a) => (typeof a === "object" ? a.name : a));
      return [];
    };

    const formattedTracks = dataToSend.tracks.map((t, index) => ({
      ...t,
      trackNumber: index + 1,
      primaryArtists: cleanArtists(t.primaryArtists),
      featuredArtists: cleanArtists(t.featuredArtists),
      writers: t.writers || [],
      additionalCredits: t.additionalCredits || [],
    }));

    try {
      const response = await axios.post("/api/releases", {
        ...dataToSend,
        tracks: formattedTracks,
        releaseId: savedReleaseId,
        isDraft: isDraftStatus,
        releaseTitle: dataToSend.title,
        artworkUrl: dataToSend.artwork,
        legalConsent: {
          agreed: hasSigned,
          signedName: legalName,
        },
        // Use the helper here too!
        primaryArtists: cleanArtists(dataToSend.primaryArtists),
        featuredArtists: cleanArtists(dataToSend.featuredArtists),
      });

      if (response.data.release) {
        const saved = response.data.release;
        setLastSaved(new Date().toLocaleTimeString()); // Added this back for visual feedback
        setSavedReleaseId(saved._id);

        setReleaseData({
          ...saved,
          // UI expects Strings
          primaryArtists: Array.isArray(saved.primaryArtists)
            ? saved.primaryArtists
                .map((a) => (typeof a === "object" ? a.name : a))
                .join(", ")
            : saved.primaryArtists || "",
          featuredArtists: Array.isArray(saved.featuredArtists)
            ? saved.featuredArtists
                .map((a) => (typeof a === "object" ? a.name : a))
                .join(", ")
            : saved.featuredArtists || "",

          tracks: saved.tracks.map((t) => ({
            ...t,
            primaryArtists: Array.isArray(t.primaryArtists)
              ? t.primaryArtists
                  .map((a) => (typeof a === "object" ? a.name : a))
                  .join(", ")
              : t.primaryArtists || "",
            featuredArtists: Array.isArray(t.featuredArtists)
              ? t.featuredArtists
                  .map((a) => (typeof a === "object" ? a.name : a))
                  .join(", ")
              : t.featuredArtists || "",
            writers: t.writers || [],
            additionalCredits: t.additionalCredits || [],
          })),
        });

        if (isDraftStatus) toast.success("Progress Saved");
      }
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving progress");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 2. STEP TRANSITION LOGIC
   * This handles the "Next" button. It synchronizes data between steps
   * and ensures the backend is updated before moving the UI.
   */
  const handleStepNext = async (currentStep) => {
    let dataToSync = { ...releaseData };

    if (currentStep === 2) {
      dataToSync.tracks = dataToSync.tracks.map((track) => {
        // Helper to check if artist data actually exists (works for string or array)
        const hasContent = (val) => {
          if (Array.isArray(val))
            return val.length > 0 && (val[0].name || val[0]);
          return typeof val === "string" && val.trim() !== "";
        };

        return {
          ...track,
          primaryArtists: hasContent(track.primaryArtists)
            ? track.primaryArtists
            : dataToSync.primaryArtists,
          featuredArtists: hasContent(track.featuredArtists)
            ? track.featuredArtists
            : dataToSync.featuredArtists,
        };
      });

      setReleaseData(dataToSync);
    }

    const success = await saveData(true, dataToSync);
    if (success) setStep(currentStep + 1);
  };

  const handleFinalSubmit = async () => {
    // 1. Scrape all tracks to get a master list of unique artists
    const allPrimary = releaseData.tracks.flatMap(
      (track) => track.primaryArtists || [],
    );
    const allFeatured = releaseData.tracks.flatMap(
      (track) => track.featuredArtists || [],
    );

    const uniquePrimary = [...new Set(allPrimary)];
    const uniqueFeatured = [...new Set(allFeatured)];

    // 2. Attach them to the final payload
    const finalData = {
      ...releaseData,
      primaryArtists: uniquePrimary,
      featuredArtists: uniqueFeatured,
    };

    // 3. Submit as final (isDraft: false)
    const success = await saveData(false, finalData);

    if (success) {
      toast.success("Release submitted for review!");
      navigate("/dashboard/releases");
    }
  };

  if (isLoading)
    return (
      <div className="p-20 text-[#EAE4D5] font-serif">Loading your work...</div>
    );

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      {/* 1. TOP HEADER (Spans full width) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
        <div>
          <h1 className="text-4xl font-serif text-[#EAE4D5] tracking-tight">
            Create New Release
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-[9px] text-[#B6B09F]/60 flex items-center gap-1.5 uppercase tracking-[0.2em] bg-[#B6B09F]/5 px-3 py-1.5 rounded-full border border-[#B6B09F]/10">
              <FaClock size={10} /> Draft expires in 10 Days
            </span>
            {savedReleaseId && (
              <span className="text-[9px] text-green-400/60 uppercase tracking-[0.2em] bg-green-400/5 px-3 py-1.5 rounded-full border border-green-400/10">
                ID: {savedReleaseId.slice(-6)}{" "}
                {lastSaved ? `• Saved at ${lastSaved}` : "(Ready)"}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => saveData(true)}
          disabled={isSubmitting || !releaseData.title}
          className="flex items-center gap-2 px-6 py-2.5 border border-[#B6B09F]/20 text-[#B6B09F] text-[10px] font-bold rounded-full hover:bg-[#B6B09F]/10 hover:text-[#EAE4D5] transition-all disabled:opacity-30 uppercase tracking-[0.2em]"
        >
          <FaSave size={10} /> Save Progress
        </button>
      </header>

      {/* 2. HORIZONTAL STEPPER */}
      <ProgressSidebar currentStep={step} />

      <main className="bg-[#0a0a0a]/40 border border-[#B6B09F]/5 rounded-2xl p-6 md:p-12 overflow-y-auto max-h-none h-auto">
        {" "}
        {step === 1 && (
          <Step1General
            data={releaseData}
            setData={setReleaseData}
            onNext={() => handleStepNext(1)} // Uses the new bridge logic
            onSave={() => saveData(true)}
            isSubmitting={isSubmitting}
            artworkProps={{
              artworkPreview,
              artworkUploading,
              handleArtworkUpload,
            }}
          />
        )}
        {step === 2 && (
          <Step2Tracks
            data={releaseData}
            setData={setReleaseData}
            onBack={() => setStep(1)}
            onNext={() => handleStepNext(2)} // Syncs artists into tracks here
            onSave={() => saveData(true)}
            isSubmitting={isSubmitting}
          />
        )}
        {step === 3 && (
          <Step3Review
            releaseData={releaseData}
            setStep={setStep}
            handleSubmit={handleFinalSubmit} // Only handles the final POST
            isSubmitting={isSubmitting}
            uploadProgress={uploadProgress}
            hasSigned={hasSigned}
            setHasSigned={setHasSigned}
            legalName={legalName}
            setLegalName={setLegalName}
            isLegalModalOpen={isLegalModalOpen}
            setIsLegalModalOpen={setIsLegalModalOpen}
          />
        )}
      </main>
    </div>
  );
};

export default ReleaseBuilder;
