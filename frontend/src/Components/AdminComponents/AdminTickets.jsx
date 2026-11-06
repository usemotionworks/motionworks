import React, { useState, useEffect } from "react";
import axios from "../../lib/axios";
import { Link } from "react-router-dom";

const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    axios.get("/api/tickets/admin").then(({ data }) => setTickets(data));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-[#EAE4D5]">Support Queue</h2>

      <div className="bg-[#050505] border border-[#B6B09F]/20 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#B6B09F]/5 text-[10px] uppercase tracking-widest text-[#B6B09F]/60">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B6B09F]/10">
            {tickets.map((ticket) => (
              <tr
                key={ticket._id}
                className="hover:bg-[#B6B09F]/5 transition-colors"
              >
                <td className="p-4 font-bold">{ticket.user?.stageName}</td>
                <td className="p-4 text-[#B6B09F]">{ticket.subject}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      ticket.status === "open"
                        ? "bg-red-500/20 text-red-500"
                        : "bg-green-500/20 text-green-500"
                    }`}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td className="p-4 text-xs">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <Link
                    to={`/admin/tickets/${ticket._id}`}
                    className="text-blue-400 hover:underline text-sm"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTickets;
