import { useState, useEffect } from "react";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

const isValidUrl = (urlString) => {
  if (!urlString) return true; // Let empty strings pass (not required)
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (e) {
    return false;
  }
};

const ArtistProfileForm = () => {
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // Master State Object
  const [formData, setFormData] = useState({
    artistName: "",
    description: "",
    primaryGenre: "",
    secondaryGenre: "",
    language: "English",
    cLine: "",
    pLine: "",
    country: "",
    phoneNumber: "",

    deliveries: {
      beatport: false,
      youtubeContentId: false,
      metaRightsManager: false,
      soundCloudMonetization: false,
      soundExchange: false,
      juno: false,
      tracklib: false,
      hook: false,
      lyricFind: false,
    },
    dspLinks: {
      spotify: "",
      appleMusic: "",
    },
    additionalInfo: {
      youtubeChannel: "",
      soundCloud: "",
      website: "",
      instagram: "",
      twitter: "",
      tiktok: "",
      isni: "",
    },
  });

  // Fetch existing profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get("/api/users/artist-profile");
        if (data) {
          // MERGE: Keep defaults for anything missing from the server
          setFormData((prev) => ({
            ...prev,
            ...data,
            deliveries: { ...prev.deliveries, ...(data.deliveries || {}) },
            dspLinks: { ...prev.dspLinks, ...(data.dspLinks || {}) }, // 👈 2. Added to merge logic
            additionalInfo: {
              ...prev.additionalInfo,
              ...(data.additionalInfo || {}),
            },
          }));
        }
      } catch (error) {
        console.log("No existing profile found or error fetching.");
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (category, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const isValidPhone = (phone) => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, "")); // Remove spaces before checking
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Max size is 5MB.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("profileImage", file); // Ensure this match your multer field name

    setImageUploading(true);
    try {
      const { data } = await axios.post("/api/users/image", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Local state now updates with the S3 URL
      setFormData((prev) => ({ ...prev, profileImage: data.imageUrl }));
      toast.success("Profile image updated on storage!");
    } catch (error) {
      toast.error("Failed to upload image.");
      console.error(error);
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValidPhone = (phone) => {
      if (!phone) return true; // Optional field
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return phoneRegex.test(phone.replace(/\s/g, "")); // Remove spaces before checking
    };

    const urlFields = [
      { category: "dspLinks", label: "DSP Links" },
      { category: "additionalInfo", label: "Social Links" },
    ];

    if (formData.phoneNumber && !isValidPhone(formData.phoneNumber)) {
      return toast.error(
        "Please enter a valid phone number including country code.",
      );
    }

    for (const group of urlFields) {
      const categoryData = formData[group.category];
      for (const key in categoryData) {
        // We skip 'isni' as it's an ID, not a URL
        if (key === "isni") continue;

        const value = categoryData[key];
        if (value && !isValidUrl(value)) {
          const friendlyName = key.replace(/([A-Z])/g, " $1").trim();
          return toast.error(
            `Invalid URL for ${friendlyName}. Please include http:// or https://`,
          );
        }
      }
    }

    setLoading(true);
    try {
      await axios.post("/api/users/artist-profile", formData);
      toast.success("Profile saved successfully!");
    } catch (error) {
      toast.error("Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStyle =
    "w-4 h-4 text-[#0a0a0a] bg-transparent border-[#B6B09F]/40 rounded focus:ring-[#EAE4D5] focus:ring-2 accent-[#EAE4D5]";
  const inputStyle =
    "w-full px-4 py-3 bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-lg text-[#EAE4D5] placeholder-[#B6B09F]/50 focus:border-[#EAE4D5] focus:outline-none transition-colors";
  const cardStyle =
    "p-6 bg-[#050505] border border-[#B6B09F]/10 rounded-xl mb-6";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto pb-12"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#EAE4D5]">Artist Profile</h1>
        <p className="text-[#B6B09F] mt-2">
          Complete your profile to sync your metadata with our distribution
          network.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* GENERAL SECTION */}
        <div className={cardStyle}>
          <h2 className="text-xl font-semibold text-[#EAE4D5] mb-4 border-b border-[#B6B09F]/10 pb-2">
            General Information
          </h2>
          <div className="space-y-4">
            {/* 📸 IMAGE UPLOAD SUB-SECTION */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
              <div className="w-32 h-32 rounded-full bg-[#0a0a0a] border-2 border-dashed border-[#B6B09F]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[#B6B09F]/40 text-xs text-center px-2">
                    No Image
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[#EAE4D5] text-sm font-medium mb-2">
                  Profile Picture
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profileImageInput"
                    disabled={imageUploading}
                  />
                  <label
                    htmlFor="profileImageInput"
                    className={`px-4 py-2 bg-[#B6B09F]/10 hover:bg-[#B6B09F]/20 text-[#EAE4D5] rounded-lg cursor-pointer transition-colors text-sm font-medium inline-block ${imageUploading ? "opacity-50 cursor-wait" : ""}`}
                  >
                    {imageUploading
                      ? "Uploading to Storage..."
                      : "Choose Image"}
                  </label>
                  <p className="text-[#B6B09F]/60 text-xs mt-2">
                    Square images work best (JPG, PNG). Max 5MB.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[#EAE4D5] text-sm mb-2">
                Artist Name
              </label>
              <input
                type="text"
                name="artistName"
                value={formData.artistName || ""}
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label className="block text-[#EAE4D5] text-sm mb-2">
                Biography / Description
              </label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows="4"
                className={inputStyle}
              />
            </div>
            {/* Add this inside your "General Information" card */}
            <div>
              <label className="block text-[#EAE4D5] text-sm mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={handleChange}
                placeholder="+234 800 000 0000"
                className={`${inputStyle} ${
                  formData.phoneNumber && !isValidPhone(formData.phoneNumber)
                    ? "border-red-500/50"
                    : ""
                }`}
              />
              {formData.phoneNumber && !isValidPhone(formData.phoneNumber) && (
                <p className="text-red-400 text-[10px] mt-1 uppercase tracking-widest">
                  Invalid phone format (e.g. +234...)
                </p>
              )}
            </div>
            <div>
              <label className="block text-[#EAE4D5] text-sm mb-2">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country || ""}
                onChange={handleChange}
                className={inputStyle}
                placeholder="e.g. Nigeria"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#EAE4D5] text-sm mb-2">
                  Primary Genre
                </label>
                <input
                  type="text"
                  name="primaryGenre"
                  value={formData.primaryGenre || ""}
                  onChange={handleChange}
                  className={inputStyle}
                  placeholder="e.g. Afrobeats"
                />
              </div>
              <div>
                <label className="block text-[#EAE4D5] text-sm mb-2">
                  Secondary Genre
                </label>
                <input
                  type="text"
                  name="secondaryGenre"
                  value={formData.secondaryGenre || ""}
                  onChange={handleChange}
                  className={inputStyle}
                />
              </div>
            </div>
          </div>
        </div>

        {/* COPYRIGHT & LINES */}
        <div className={cardStyle}>
          <h2 className="text-xl font-semibold text-[#EAE4D5] mb-4 border-b border-[#B6B09F]/10 pb-2">
            Label & Copyright Defaults
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#EAE4D5] text-sm mb-2">
                C Line (Copyright)
              </label>
              <input
                type="text"
                name="cLine"
                value={formData.cLine || ""}
                onChange={handleChange}
                className={inputStyle}
                placeholder="© 2026 Artist Name"
              />
            </div>
            <div>
              <label className="block text-[#EAE4D5] text-sm mb-2">
                P Line (Phonographic)
              </label>
              <input
                type="text"
                name="pLine"
                value={formData.pLine || ""}
                onChange={handleChange}
                className={inputStyle}
                placeholder="℗ 2026 Motion Works"
              />
            </div>
          </div>
        </div>

        {/* DSP LINKS 👈 3. Added Section */}
        <div className={cardStyle}>
          <h2 className="text-xl font-semibold text-[#EAE4D5] mb-4 border-b border-[#B6B09F]/10 pb-2">
            Streaming Platforms (DSP Links)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#EAE4D5] text-sm mb-2">
                Spotify Artist URL
              </label>
              <input
                type="text"
                value={formData.dspLinks?.spotify || ""}
                onChange={(e) =>
                  handleNestedChange("dspLinks", "spotify", e.target.value)
                }
                className={`${inputStyle} ${
                  formData.dspLinks?.spotify &&
                  !isValidUrl(formData.dspLinks.spotify)
                    ? "border-red-500/50"
                    : ""
                }`}
                placeholder="https://open.spotify.com/..."
              />
            </div>
            <div>
              <label className="block text-[#EAE4D5] text-sm mb-2">
                Apple Music Artist URL
              </label>
              <input
                type="text"
                value={formData.dspLinks?.appleMusic || ""}
                onChange={(e) =>
                  handleNestedChange("dspLinks", "appleMusic", e.target.value)
                }
                className={inputStyle}
                placeholder="https://music.apple.com/artist/..."
              />
            </div>
          </div>
        </div>

        {/* ADDITIONAL DELIVERIES (TOGGLES) */}
        <div className={cardStyle}>
          <h2 className="text-xl font-semibold text-[#EAE4D5] mb-4 border-b border-[#B6B09F]/10 pb-2">
            Additional Deliveries & Monetization
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(formData.deliveries || {}).map((key) => (
              <label
                key={key}
                className="flex items-center space-x-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={formData.deliveries[key]}
                  onChange={(e) =>
                    handleNestedChange("deliveries", key, e.target.checked)
                  }
                  className={toggleStyle}
                />
                <span className="text-[#B6B09F] text-sm group-hover:text-[#EAE4D5] transition-colors capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* LINKS & SOCIALS */}
        <div className={cardStyle}>
          <h2 className="text-xl font-semibold text-[#EAE4D5] mb-4 border-b border-[#B6B09F]/10 pb-2">
            Socials & Identifiers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(formData.additionalInfo || {}).map((key) => (
              <div key={key}>
                <label className="block text-[#EAE4D5] text-sm mb-2 capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </label>
                <input
                  type="text"
                  value={formData.additionalInfo[key]}
                  onChange={(e) =>
                    handleNestedChange("additionalInfo", key, e.target.value)
                  }
                  className={inputStyle}
                  placeholder={`Enter ${key}`}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#EAE4D5] text-[#0a0a0a] font-bold rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
        >
          {loading ? "Saving Profile..." : "Save Profile Data"}
        </button>
      </form>
    </motion.div>
  );
};

export default ArtistProfileForm;
