import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaShieldAlt,
  FaClock,
  FaTimes,
  FaCode,
} from "react-icons/fa";
import axios from "../../lib/axios.js";

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // 🚀 State for the JSON Modal
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get("/api/admin/audit-logs");
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminId?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-[#EAE4D5]">
            <FaShieldAlt className="text-red-500" /> System Audit Trail
          </h1>
          <p className="text-[#B6B09F]/50 text-sm mt-1">
            Immutable record of all administrative actions.
          </p>
        </div>

        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B6B09F]/30" />
          <input
            type="text"
            placeholder="Search actions or admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#050505] border border-[#B6B09F]/20 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-[#EAE4D5] outline-none w-full md:w-64 transition-all"
          />
        </div>
      </header>

      {/* --- Main Table --- */}
      <div className="bg-[#050505] border border-[#B6B09F]/10 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs uppercase tracking-wider">
          <thead className="bg-[#B6B09F]/5 border-b border-[#B6B09F]/10 text-[#B6B09F]">
            <tr>
              <th className="px-6 py-4 font-bold">Timestamp</th>
              <th className="px-6 py-4 font-bold">Admin</th>
              <th className="px-6 py-4 font-bold">Action</th>
              <th className="px-6 py-4 font-bold">Target ID</th>
              <th className="px-6 py-4 font-bold text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B6B09F]/5">
            {filteredLogs.map((log) => (
              <tr
                key={log._id}
                className="hover:bg-[#B6B09F]/5 transition-colors group"
              >
                <td className="px-6 py-4 text-[#B6B09F]/60 flex items-center gap-2 whitespace-nowrap">
                  <FaClock size={10} />
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-bold text-[#EAE4D5]">
                  {log.adminId?.name || "System"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-[9px] font-bold ${
                      log.action.includes("REJECT")
                        ? "bg-red-500/10 text-red-500"
                        : log.action.includes("APPROVE") ||
                            log.action.includes("VERIFIED")
                          ? "bg-green-500/10 text-green-500"
                          : "bg-[#B6B09F]/10 text-[#B6B09F]"
                    }`}
                  >
                    {log.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-[#B6B09F]/40 text-[10px]">
                  {log.targetId?.substring(0, 12)}...
                </td>
                <td className="px-6 py-4 font-mono text-[#B6B09F]/40 text-[10px]">
                  {log.adminId?.email}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- JSON Details Modal --- */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          />
          <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-[#B6B09F]/20 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[#B6B09F]/10">
              <div className="flex items-center gap-3">
                <FaCode className="text-red-500" />
                <h3 className="font-bold text-[#EAE4D5] uppercase tracking-widest text-xs">
                  Action Metadata
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#B6B09F] hover:text-white"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[70vh]">
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] text-[#B6B09F]/40 uppercase mb-1">
                    IP Address
                  </p>
                  <p className="text-xs text-[#B6B09F]">
                    {selectedLog.ipAddress || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-[#B6B09F]/40 uppercase mb-1">
                    Target Model
                  </p>
                  <p className="text-xs text-[#B6B09F]">
                    {selectedLog.targetModel || "N/A"}
                  </p>
                </div>
              </div>

              <p className="text-[9px] text-[#B6B09F]/40 uppercase mb-2">
                Payload / Changes
              </p>
              <pre className="bg-black/50 p-4 rounded-lg border border-[#B6B09F]/5 text-[#EAE4D5] text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(selectedLog.changes, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-[#B6B09F]/5 text-center">
              <p className="text-[9px] text-[#B6B09F]/40 uppercase italic">
                This log entry is immutable and cannot be modified.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
