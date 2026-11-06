import React, { useState, useEffect } from "react";
import axios from "../../lib/axios";
import { Link } from "react-router-dom";
import { FaPlus, FaChevronRight } from "react-icons/fa";

const TicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/tickets/my-tickets").then(({ data }) => {
      setTickets(data);
      setLoading(false);
    });
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case "open":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "in-progress":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "resolved":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      default:
        return "bg-[#B6B09F]/10 text-[#B6B09F]/60 border-[#B6B09F]/10";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif text-[#EAE4D5]">
            Support Tickets
          </h2>
          <p className="text-sm text-[#B6B09F]/60">
            Manage your inquiries and technical requests
          </p>
        </div>
        <Link
          to="/dashboard/tickets/new"
          className="flex items-center gap-2 px-5 py-2 bg-[#EAE4D5] text-black rounded-lg text-sm font-bold hover:bg-white transition-all"
        >
          <FaPlus size={12} /> New Ticket
        </Link>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <Link
            key={ticket._id}
            to={`/dashboard/tickets/${ticket._id}`}
            className="group flex items-center justify-between p-5 bg-[#0a0a0a] border border-[#B6B09F]/10 rounded-xl hover:border-[#EAE4D5]/30 transition-all"
          >
            <div className="flex gap-4 items-center">
              <div
                className={`w-2 h-2 rounded-full ${ticket.status === "open" ? "animate-pulse bg-blue-400" : "bg-transparent"}`}
              />
              <div>
                <h4 className="text-[#EAE4D5] font-medium group-hover:text-white transition-colors">
                  {ticket.subject}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] uppercase tracking-widest text-[#B6B09F]/40">
                    ID: {ticket._id.slice(-6)}
                  </span>
                  <span
                    className={`text-[10px] uppercase px-2 py-0.5 rounded border font-bold ${getStatusStyle(ticket.status)}`}
                  >
                    {ticket.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-[#B6B09F]/40 uppercase tracking-tighter">
                  Last Activity
                </p>
                <p className="text-xs text-[#B6B09F]/80">
                  {new Date(ticket.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <FaChevronRight className="text-[#B6B09F]/20 group-hover:text-[#EAE4D5] transition-all" />
            </div>
          </Link>
        ))}

        {!loading && tickets.length === 0 && (
          <div className="text-center py-20 bg-[#0a0a0a] border border-dashed border-[#B6B09F]/10 rounded-xl">
            <p className="text-[#B6B09F]/40">No support tickets found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketList;
