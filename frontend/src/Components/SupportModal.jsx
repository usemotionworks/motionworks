import { useState } from "react";
import { createPortal } from "react-dom"; // 👈 Import createPortal
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const SupportModal = ({ isOpen, onClose }) => {
  const [serviceType, setServiceType] = useState("Marketing & PR");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("/api/users/support", {
        serviceType,
        message,
      });
      toast.success(res.data.message);
      setMessage("");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // 🚀 Wrap the whole modal in createPortal
  return createPortal(
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
      {" "}
      {/* Pushed z-index way up */}
      <div className="bg-[#050505] border border-[#B6B09F]/20 p-8 rounded-xl max-w-lg w-full mx-4 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#B6B09F] hover:text-[#EAE4D5]"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-[#EAE4D5] mb-2">
          Request Label Services
        </h2>
        <p className="text-[#B6B09F] mb-6 text-sm">
          Need extra push for your release? Request marketing, radio plugging,
          or general support here.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#EAE4D5] text-sm font-medium mb-2">
              What do you need help with?
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] outline-none transition-colors text-sm"
            >
              <option value="Marketing & PR">Marketing & PR</option>
              <option value="Radio Plugging">Radio Plugging</option>
              <option value="Playlist Pitching">Playlist Pitching</option>
              <option value="Influencer Campaign">Influencer Campaign</option>
              <option value="General Support / Account Issue">
                General Support / Account Issue
              </option>
            </select>
          </div>

          <div>
            <label className="block text-[#EAE4D5] text-sm font-medium mb-2">
              Tell us more about your request
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] outline-none transition-colors text-sm"
              placeholder="Provide as much detail as possible..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#EAE4D5] text-[#0a0a0a] font-bold rounded-lg hover:bg-opacity-90 transition-colors text-sm"
          >
            {loading ? "Sending..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>,
    document.body, // 👈 This teleports the modal HTML right to the bottom of the body tag!
  );
};

export default SupportModal;
