import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";

const AdminLayout = () => {
  const { logout } = useUserStore();
  const location = useLocation();
  const navigate = useNavigate();

  // 🚀 Added state for mobile drawer
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navLinks = [
    { name: "Overview", path: "/admin" },
    { name: "Users & KYC", path: "/admin/users" },
    { name: "Release Queue", path: "/admin/releases" },
    { name: "Withdrawals", path: "/admin/withdrawals" },
    { name: "Activity Logs", path: "/admin/logs" },
    { name: "Support Tickets", path: "/admin/tickets" },
    { name: "Smartlink Queue", path: "/admin/smartlink" },
  ];

  const handleLogout = () => {
    logout(navigate);
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0a] text-[#EAE4D5] relative">
      {/* 📱 Mobile Top Bar (Only visible on small screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#050505] border-b border-[#B6B09F]/20 flex items-center justify-between px-6 z-40">
        <h2 className="text-xl font-bold tracking-tight">Admin Portal</h2>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="text-[#EAE4D5] p-2 focus:outline-none"
        >
          {/* Hamburger Icon */}
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* 📱 Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 💻 Sidebar (Responsive Drawer) */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#050505] border-r border-[#B6B09F]/20 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0
      `}
      >
        <div className="p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Admin Portal</h2>
            <p className="text-xs text-red-500 mt-1 uppercase font-bold tracking-widest">
              God Mode
            </p>
          </div>
          {/* Close button for Mobile Drawer */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-[#B6B09F] hover:text-[#EAE4D5]"
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
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navLinks.map((link) => {
            const isActive =
              location.pathname === link.path ||
              (link.path !== "/admin" &&
                location.pathname.startsWith(link.path));

            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsSidebarOpen(false)} // Close drawer on link click
                className={`block px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#EAE4D5] text-[#0a0a0a] font-bold"
                    : "text-[#B6B09F] hover:bg-[#B6B09F]/10 hover:text-[#EAE4D5]"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#B6B09F]/20">
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 border border-red-500/50 text-red-500 rounded hover:bg-red-500/10 transition-colors"
          >
            Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto mt-16 md:mt-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
