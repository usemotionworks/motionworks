
import { useEffect, useState } from "react";
import { FaTimes, FaBarcode, FaMusic } from "react-icons/fa";

const DistributionDetailsModal = ({
  isOpen,
  onClose,
  onConfirm,
  release,
  loading = false,
}) => {
  const [upc, setUpc] = useState("");
  const [trackIsrcs, setTrackIsrcs] = useState({});

  useEffect(() => {
    if (isOpen && release) {
      setUpc(release.upc || "");

      const existingIsrcs = {};

      release.tracks?.forEach((track) => {
        existingIsrcs[track._id] = track.isrc || "";
      });

      setTrackIsrcs(existingIsrcs);
    }
  }, [isOpen, release]);

  if (!isOpen || !release) return null;

  const updateTrackIsrc = (trackId, value) => {
    setTrackIsrcs((prev) => ({
      ...prev,
      [trackId]: value.toUpperCase(),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      upc: upc.trim(),
      trackIsrcs: release.tracks.map((track) => ({
        trackId: track._id,
        isrc: trackIsrcs[track._id]?.trim().toUpperCase() || "",
      })),
    };

    onConfirm(payload);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#090909] border border-[#B6B09F]/20 rounded-2xl shadow-2xl">

        <div className="sticky top-0 z-10 bg-[#090909] border-b border-[#B6B09F]/10 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-serif text-[#EAE4D5]">
              Distribution Details
            </h2>
            <p className="text-xs text-[#B6B09F]/60 mt-1">
              Enter the identifiers provided by your distributor.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-[#B6B09F] hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">

          {/* Release-level UPC */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaBarcode className="text-[#B6B09F]" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#EAE4D5]">
                Release Identifier
              </h3>
            </div>

            <label className="block text-xs text-[#B6B09F] mb-2">
              UPC / EAN
            </label>

            <input
              type="text"
              value={upc}
              onChange={(e) => setUpc(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter release UPC"
              required
              maxLength={14}
              inputMode="numeric"
              className="w-full bg-black border border-[#B6B09F]/20 rounded-lg px-4 py-3 text-[#EAE4D5] outline-none focus:border-[#B6B09F]/60"
            />

            <p className="text-[10px] text-[#B6B09F]/40 mt-2">
              One UPC applies to the entire release, not individual tracks.
            </p>
          </section>

          {/* Track-level ISRCs */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FaMusic className="text-[#B6B09F]" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#EAE4D5]">
                Track Identifiers
              </h3>
            </div>

            <div className="space-y-4">
              {release.tracks?.map((track, index) => (
                <div
                  key={track._id}
                  className="bg-white/[0.02] border border-[#B6B09F]/10 rounded-xl p-4"
                >
                  <div className="flex justify-between gap-3 mb-3">
                    <div>
                      <p className="text-[10px] text-[#B6B09F]/50 uppercase tracking-widest">
                        Track {track.trackNumber || index + 1}
                      </p>

                      <p className="text-sm text-[#EAE4D5] font-medium mt-1">
                        {track.title}
                      </p>
                    </div>

                    <span className="text-[10px] text-[#B6B09F]/40">
                      ISRC
                    </span>
                  </div>

                  <input
                    type="text"
                    value={trackIsrcs[track._id] || ""}
                    onChange={(e) =>
                      updateTrackIsrc(track._id, e.target.value)
                    }
                    placeholder="e.g. USABC2412345"
                    required
                    maxLength={12}
                    className="w-full bg-black border border-[#B6B09F]/20 rounded-lg px-4 py-3 text-sm text-[#EAE4D5] uppercase outline-none focus:border-[#B6B09F]/60"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="bg-[#B6B09F]/5 border border-[#B6B09F]/10 rounded-lg p-4">
            <p className="text-xs text-[#B6B09F] leading-relaxed">
              Confirm that these identifiers match the details supplied by
              your distributor. Once submitted, the release will be marked
              as distributed and added to the DSP catalogue discovery queue.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 border border-[#B6B09F]/20 text-[#B6B09F] rounded-lg text-xs font-bold uppercase tracking-widest"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !release.tracks?.length}
              className="flex-1 py-3 bg-[#EAE4D5] text-black rounded-lg text-xs font-black uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Confirm Distribution"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DistributionDetailsModal;
