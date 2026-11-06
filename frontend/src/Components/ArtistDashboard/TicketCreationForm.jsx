import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../lib/axios";
import { FaPaperclip, FaSpinner } from "react-icons/fa";

const CreateTicket = () => {
  const [formData, setFormData] = useState({
    subject: "",
    category: "Technical",
    description: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let attachmentUrl = "";

      // 1. Handle S3 Upload if file exists
      if (file) {
        const fileData = new FormData();
        fileData.append("file", file);
        // Assuming you have a generic upload route that returns S3 URL
        const uploadRes = await axios.post(
          "/api/tickets/upload-attachment",
          fileData,
        );
        attachmentUrl = uploadRes.data.url;
      }

      // 2. Create Ticket in DB
      await axios.post("/api/tickets", {
        ...formData,
        attachments: attachmentUrl
          ? [{ url: attachmentUrl, name: file.name }]
          : [],
      });

      navigate("/dashboard/tickets");
    } catch (err) {
      console.error("Ticket creation failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-serif text-[#EAE4D5] mb-6">
        Open Support Ticket
      </h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-[#0a0a0a] p-8 border border-[#B6B09F]/10 rounded-xl"
      >
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#B6B09F]/60 mb-2">
            Subject
          </label>
          <input
            required
            className="w-full bg-[#050505] border border-[#B6B09F]/10 rounded-lg p-3 text-[#EAE4D5] focus:border-[#EAE4D5]/50 outline-none"
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#B6B09F]/60 mb-2">
            Category
          </label>
          <select
            className="w-full bg-[#050505] border border-[#B6B09F]/10 rounded-lg p-3 text-[#EAE4D5] outline-none"
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          >
            <option>Technical</option>
            <option>Billing</option>
            <option>Metadata</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#B6B09F]/60 mb-2">
            Description
          </label>
          <textarea
            required
            rows="5"
            className="w-full bg-[#050505] border border-[#B6B09F]/10 rounded-lg p-3 text-[#EAE4D5] outline-none"
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#B6B09F]/5 border border-[#B6B09F]/20 rounded-lg text-xs hover:bg-[#B6B09F]/10 transition-all">
            <FaPaperclip /> {file ? file.name : "Attach Screenshot"}
            <input
              type="file"
              hidden
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>
        </div>

        <button
          disabled={loading}
          className="w-full py-4 bg-[#EAE4D5] text-black font-bold uppercase tracking-widest rounded-lg flex justify-center items-center gap-2"
        >
          {loading ? <FaSpinner className="animate-spin" /> : "Submit Ticket"}
        </button>
      </form>
    </div>
  );
};

export default CreateTicket;
