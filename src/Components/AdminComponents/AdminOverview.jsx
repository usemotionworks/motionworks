import { useEffect, useState } from "react";
import axios from "../../lib/axios";
import { FaUsers, FaMusic, FaWallet, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalArtists: 0,
    pendingReleases: 0,
    pendingWithdrawals: 0,
    takedownRequests: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get("/api/admin/stats");
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Total Artists",
      value: stats.totalArtists,
      icon: <FaUsers className="text-blue-400" />,
      link: "/admin/users",
    },
    {
      label: "Pending Releases",
      value: stats.pendingReleases,
      icon: <FaMusic className="text-yellow-500" />,
      link: "/admin/releases",
    },
    {
      label: "Pending Withdrawals",
      value: stats.pendingWithdrawals.length,
      icon: <FaWallet className="text-red-400" />,
      link: "/admin/withdrawals",
    },
    {
      label: "Pending Takedowns",
      value: stats.takedownRequests,
      icon: <FaMusic className="text-yellow-500" />,
      link: "/admin/takedowns",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#EAE4D5] mb-2 uppercase tracking-tight">
          God Mode
        </h1>
        <p className="text-[#B6B09F] text-sm">
          Real-time platform performance and action items.
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <Link
            to={card.link}
            key={idx}
            className="p-6 bg-[#050505] border border-[#B6B09F]/10 rounded-xl hover:border-[#B6B09F]/40 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-[#0a0a0a] rounded-lg border border-[#B6B09F]/5 text-xl">
                {card.icon}
              </div>
              <FaArrowRight className="text-[#B6B09F]/20 group-hover:text-[#EAE4D5] transition-colors" />
            </div>
            <p className="text-[#B6B09F] text-xs uppercase tracking-widest">
              {card.label}
            </p>
            <p className="text-4xl font-bold mt-2 text-[#EAE4D5]">
              {loading ? "..." : card.value}
            </p>
          </Link>
        ))}
      </div>

      {/* QUICK ACTIONS / ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#050505] border border-[#B6B09F]/10 rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#EAE4D5] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            Needs Review
          </h2>

          <div className="space-y-4">
            {stats.pendingReleases > 0 ? (
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#B6B09F]/5 rounded-lg">
                <div>
                  <p className="text-[#EAE4D5] text-sm font-medium">
                    {stats.pendingReleases} New Submissions
                  </p>
                  <p className="text-[#B6B09F] text-xs">
                    Waiting for store delivery
                  </p>
                </div>
                <Link
                  to="/admin/releases"
                  className="px-4 py-2 bg-[#EAE4D5] text-[#0a0a0a] text-xs font-bold rounded hover:opacity-90"
                >
                  REVIEW NOW
                </Link>
              </div>
            ) : (
              <p className="text-[#B6B09F] text-sm italic">
                Queue is empty. Everything is live!
              </p>
            )}
          </div>
        </div>

        <div className="bg-[#050505] border border-[#B6B09F]/10 rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#EAE4D5] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            Needs Takedown
          </h2>

          <div className="space-y-4">
            {stats.takedownRequests > 0 ? (
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#B6B09F]/5 rounded-lg">
                <div>
                  <p className="text-[#EAE4D5] text-sm font-medium">
                    {stats.takedownRequests} New Request(s)
                  </p>
                  <p className="text-[#B6B09F] text-xs">

                  </p>
                </div>
                <Link
                  to="/admin/takedowns"
                  className="px-4 py-2 bg-[#EAE4D5] text-[#0a0a0a] text-xs font-bold rounded hover:opacity-90"
                >
                  REVIEW NOW
                </Link>
              </div>
            ) : (
              <p className="text-[#B6B09F] text-sm italic">
                Queue is empty. Everything is live!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
