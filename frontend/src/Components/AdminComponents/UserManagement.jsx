import { useEffect, useState } from "react";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";
import { FaSearch, FaUserCheck } from "react-icons/fa";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/admin/users");
      setUsers(res.data);
    } catch (error) {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleManualVerify = async (id) => {
    try {
      await axios.put(`/api/admin/users/${id}/verify`, { status: "verified" });
      toast.success("User manually verified!");
      setUsers((prev) =>
        prev.map((u) =>
          u._id === id
            ? { ...u, verification: { ...u.verification, status: "verified" } }
            : u,
        ),
      );
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // 🔍 Filter Logic
  const filteredUsers = users.filter((user) => {
    const searchStr = searchTerm.toLowerCase();
    return (
      user.stageName?.toLowerCase().includes(searchStr) ||
      user.legalName?.toLowerCase().includes(searchStr) ||
      user.email?.toLowerCase().includes(searchStr)
    );
  });

  if (loading) return <div className="text-[#B6B09F]">Loading users...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-[#EAE4D5]">
          Artist Management
        </h1>
        <p className="text-[#B6B09F]">
          View, monitor, and manually verify platform users.
        </p>
      </div>

      {/* 🔎 Search Bar */}
      <div className="relative max-w-md">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B6B09F]/40" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-[#050505] border border-[#B6B09F]/10 rounded-xl text-[#EAE4D5] focus:border-[#EAE4D5] outline-none transition-all"
        />
      </div>

      <div className="bg-[#050505] border border-[#B6B09F]/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#B6B09F]/5 text-[#EAE4D5] text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4 font-semibold">Artist / Account</th>
              <th className="px-6 py-4 font-semibold">Contact Info</th>
              <th className="px-6 py-4 font-semibold">Verification Status</th>
              <th className="px-6 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B6B09F]/10">
            {filteredUsers.map((user) => {
              const status = user.verification?.status || "unverified";
              return (
                <tr
                  key={user._id}
                  className="text-[#EAE4D5] text-sm hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold">
                      {user.stageName || "No Stage Name"}
                    </p>
                    <p className="text-xs text-[#B6B09F]">{user.legalName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs">{user.email}</p>
                    <p className="text-[10px] text-[#B6B09F] mt-1">
                      {user.phoneNumber || "No Phone Registered"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        status === "verified"
                          ? "bg-green-500/10 text-green-400"
                          : status === "pending"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {status !== "verified" && (
                      <button
                        onClick={() => handleManualVerify(user._id)}
                        className="p-2 border border-[#B6B09F]/20 text-[#B6B09F] rounded-lg hover:border-[#EAE4D5] hover:text-[#EAE4D5] transition-all"
                        title="Verify User"
                      >
                        <FaUserCheck />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
