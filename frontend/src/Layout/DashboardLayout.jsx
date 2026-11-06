import { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";
import logo from "../assets/motion.png";
import {
  FaChartLine,
  FaWallet,
  FaMusic,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaTicketAlt,
  FaUserCircle,
  FaUsers, // 🚀 Added for Collabs
} from "react-icons/fa";
import SupportModal from "../Components/SupportModal";
import { ScreenShare } from "lucide-react";
import axios from "../lib/axios";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useUserStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [pendingCollabs, setPendingCollabs] = useState(0);
  const [activeTickets, setActiveTickets] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [collabRes, ticketRes] = await Promise.all([
          axios.get("/api/collaborations/pending-count"),
          axios.get("/api/tickets/active-count"),
        ]);
        setPendingCollabs(collabRes.data.count);
        setActiveTickets(ticketRes.data.count);
      } catch (err) {
        console.error("Notification sync failed");
      }
    };
    fetchCounts();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const res = await axios.get("/api/collaborations/pending-count");
        setPendingCollabs(res.data.count);
      } catch (err) {
        console.error("Failed to fetch notification count");
      }
    };

    fetchNotificationCount();
    // Optional: Set an interval to poll every 5 mins
    const interval = setInterval(fetchNotificationCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getRankName = () => {
    const count = user?.releaseCount || 0;
    if (count >= 20) return "Pro";
    if (count >= 10) return "Rising";
    return "Newcomer";
  };

  const navLinks = [
    { name: "Overview", path: "/dashboard", icon: <FaChartLine /> },
    {
      name: "Artist Profile",
      path: "/dashboard/profile",
      icon: <FaUserCircle />,
    },
    { name: "My Releases", path: "/dashboard/releases", icon: <FaMusic /> },
    {
      name: "Collaborations",
      path: "/dashboard/collaborations",
      icon: <FaUsers />,
      badge: pendingCollabs,
    },
    { name: "Wallet & Payouts", path: "/dashboard/wallet", icon: <FaWallet /> },
    { name: "Settings", path: "/dashboard/settings", icon: <FaCog /> },
    {
      name: "Support",
      path: "/dashboard/tickets",
      icon: <FaTicketAlt />,
      badge: activeTickets,
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex text-[#B6B09F]">
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a] border-b border-[#B6B09F]/10 flex items-center justify-between px-6 z-50">
        <Link to="/dashboard">
          <img src={logo} alt="Motion Works" className="h-8 w-auto" />
        </Link>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-[#EAE4D5] text-xl"
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* SIDEBAR (Desktop & Mobile drawer) */}
      <aside
        className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-[#0a0a0a] border-r border-[#B6B09F]/10
        flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <div className="px-6 py-8">
          {/* Logo */}
          <Link to="/dashboard" className="hidden md:block mb-10">
            <img src={logo} alt="Motion Works" className="h-10 w-auto" />
          </Link>

          {/* Artist Profile Quick View */}
          <div className="mb-8 p-4 bg-[#050505] border border-[#B6B09F]/10 rounded-lg relative overflow-hidden">
            <div
              className={`absolute top-0 right-0 text-black text-[8px] font-bold px-2 py-1 uppercase rounded-bl-lg ${
                getRankName() === "Pro" ? "bg-yellow-500" : "bg-[#EAE4D5]"
              }`}
            >
              Rank: {getRankName()}
            </div>
            <p className="text-xs uppercase tracking-wider text-[#B6B09F]/60 mt-2">
              Artist Account
            </p>
            <p className="text-[#EAE4D5] font-bold truncate">
              {user?.stageName || "Artist"}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                        flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all duration-300
                        ${isActive ? "bg-[#EAE4D5] text-[#0a0a0a]" : "text-[#B6B09F] hover:text-[#EAE4D5] hover:bg-[#B6B09F]/5"}
                      `}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-lg">{link.icon}</span>
                    {link.name}
                  </div>

                  {/* 🚀 THE BADGE */}
                  {link.badge > 0 && (
                    <span
                      className={`
                          text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors
                          ${isActive ? "bg-[#0a0a0a] text-[#EAE4D5]" : "bg-red-500 text-white"}
                        `}
                    >
                      {link.badge > 9 ? "9+" : link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={() => setIsSupportOpen(true)}
              className="w-full text-left px-4 py-2 text-[#B6B09F] hover:text-[#EAE4D5] text-sm mt-4 flex items-center gap-4"
            >
              <ScreenShare size={18} />
              <span>Label Services</span>
            </button>

            <SupportModal
              isOpen={isSupportOpen}
              onClose={() => setIsSupportOpen(false)}
            />
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-6 border-t border-[#B6B09F]/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-lg transition-colors font-medium"
          >
            <FaSignOutAlt className="text-lg" />
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow md:ml-0 pt-16 md:pt-0 overflow-y-auto">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <Outlet />
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
