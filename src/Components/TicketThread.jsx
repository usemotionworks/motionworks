import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "../lib/axios";
import {
  FaPaperclip,
  FaChevronLeft,
  FaCheckCircle,
  FaFileDownload,
} from "react-icons/fa";
import { useUserStore } from "../store/useUserStore";
import toast from "react-hot-toast"; // 👈 Import toast

const TicketThread = ({ isAdminView = false }) => {
  const { id } = useParams();
  const { user } = useUserStore();
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [activeImage, setActiveImage] = useState(null);
  const scrollRef = useRef();

  const fetchTicket = async () => {
    try {
      const { data } = await axios.get(`/api/tickets/${id}`);
      setTicket(data);
    } catch (err) {
      toast.error("Failed to load conversation");
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const { data } = await axios.post(`/api/tickets/${id}/reply`, {
        message,
      });
      setTicket(data);
      setMessage("");
      toast.success("Reply sent");
    } catch (err) {
      toast.error("Message failed to send");
    }
  };

  const handleResolve = async () => {
    try {
      await axios.patch(`/api/tickets/${id}/resolve`);
      toast.success("Ticket marked as Resolved", {
        icon: "✅",
        style: {
          background: "#0a0a0a",
          color: "#EAE4D5",
          border: "1px solid #B6B09F20",
        },
      });
      fetchTicket(); // Refresh to update status UI
    } catch (err) {
      toast.error("Action failed");
    }
  };

  // Helper to render attachments
  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {attachments.map((file, i) => {
          const isImage = file.url.match(/\.(jpeg|jpg|gif|png|webp)$/i);

          return (
            <div key={i} className="group relative">
              {isImage ? (
                /* Clickable Preview for Images */
                <div
                  onClick={() => setActiveImage(file.url)}
                  className="cursor-zoom-in overflow-hidden rounded-lg border border-white/10 hover:border-[#EAE4D5]/50 transition-all"
                >
                  <img
                    src={file.url}
                    alt="attachment"
                    className="w-16 h-16 object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ) : (
                /* Standard download for non-image files */
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-2 bg-black/40 border border-white/10 rounded-lg hover:bg-black/60 transition-all"
                >
                  <FaFileDownload className="text-[#B6B09F]" />
                  <span className="text-[10px] text-[#B6B09F] max-w-[100px] truncate">
                    {file.name}
                  </span>
                </a>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!ticket)
    return (
      <div className="p-10 text-center animate-pulse text-[#B6B09F]">
        Synchronizing...
      </div>
    );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">
      {/* 🚀 IMAGE LIGHTBOX OVERLAY */}
      {activeImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-20"
          onClick={() => setActiveImage(null)}
        >
          <button className="absolute top-10 right-10 text-[#EAE4D5] hover:rotate-90 transition-all text-3xl">
            &times;
          </button>
          <img
            src={activeImage}
            className="max-w-full max-h-full rounded shadow-2xl object-contain animate-in zoom-in duration-300"
            alt="Full view"
          />
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 border-b border-[#B6B09F]/10 pb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-serif text-[#EAE4D5]">
            {ticket.subject}
          </h2>
          <span
            className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
              ticket.status === "resolved"
                ? "bg-green-500/20 text-green-400"
                : "bg-[#B6B09F]/10 text-[#B6B09F]"
            }`}
          >
            {ticket.status}
          </span>
        </div>
        {isAdminView &&
          ticket.status !== "resolved" &&
          ticket.status !== "closed" && (
            <button
              onClick={handleResolve}
              className="text-xs bg-[#EAE4D5] text-black px-4 py-2 rounded-lg font-bold hover:bg-white transition-all flex items-center gap-2"
            >
              <FaCheckCircle /> Mark Resolved
            </button>
          )}
      </div>

      {/* CHAT AREA */}
      <div className="flex-grow overflow-y-auto space-y-4 pr-4 custom-scrollbar">
        {/* Initial Post */}
        <div className="flex justify-start">
          <div className="bg-[#111] border border-[#B6B09F]/10 p-5 rounded-2xl max-w-[85%] text-sm">
            <p className="text-[#B6B09F]/60 text-[10px] uppercase tracking-widest mb-2">
              Inquiry Detail
            </p>
            <p className="text-[#EAE4D5] leading-relaxed">
              {ticket.description}
            </p>
            {renderAttachments(ticket.attachments)}
          </div>
        </div>

        {ticket.messages.map((msg, index) => {
          // 1. Check if msg.sender is an object (populated) or just an ID string
          const senderId = msg.sender?._id || msg.sender;

          // 2. Convert both to strings before comparing to avoid Object vs String mismatch
          const isMe = senderId?.toString() === user?._id?.toString();

          return (
            <div
              key={index}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-4 rounded-2xl max-w-[80%] text-sm ${
                  isMe
                    ? "bg-[#EAE4D5] text-black rounded-tr-none shadow-lg shadow-black/20"
                    : "bg-[#111] border border-[#B6B09F]/10 text-[#EAE4D5] rounded-tl-none"
                }`}
              >
                <p>{msg.message}</p>
                {/* ... rest of your code */}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>
      {/* INPUT AREA */}
      {ticket.status === "closed" ? (
        <div className="text-center py-4 text-[#B6B09F]/40 text-xs italic">
          This ticket is closed and cannot receive further replies.
        </div>
      ) : (
        <form
          onSubmit={handleSend}
          className="mt-4 bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-xl p-2 flex items-center gap-2"
        >
          <button
            type="button"
            className="p-3 text-[#B6B09F] hover:text-[#EAE4D5]"
          >
            <FaPaperclip size={18} />
          </button>
          <input
            className="flex-grow bg-transparent p-3 outline-none text-sm text-[#EAE4D5]"
            placeholder="Type your reply..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            className="bg-[#EAE4D5] text-black px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-transform active:scale-95"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
};

export default TicketThread;
