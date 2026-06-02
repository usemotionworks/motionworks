import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation, // 👈 Added useLocation here
} from "react-router-dom";

//Static Pages
import Homepage from "./Pages/Homepage";
import About from "./Pages/About";

import Contact from "./Pages/Contact";
import Footer from "./Layout/Footer";
import Terms from "./Pages/Terms";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import CookieConsent from "./Components/CookieConsent";
import CookiePolicy from "./Pages/CookiePolicy";
import IsrcAnalyticsDashboard from "./Components/IsrcAnalyticsDashboard";
import CreateSmartlink from "./Components/CreateSmartlink";
import SmartlinkPage from "./Pages/SmartLinkPage";

// Layouts
import Layout from "./Layout/Layout";
import AdminLayout from "./Layout/AdminLayout";
import Header from "./Layout/Header";

//Auth Pages
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import VerifyEmail from "./Pages/VerifyEmail";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";

// Documentation
import Documentation from "./Components/Documentation";
import ArticleDetail from "./Components/ArticleDetail";

//Protected Routes
import ProtectedRoute from "./Components/ProtectedRoute";
import AdminRoute from "./Components/AdminRoute";

// Dashboard routes
import DashboardLayout from "./Layout/DashboardLayout";
import SettingsPage from "./Components/ArtistDashboard/SettingsPage";
import DashboardOverview from "./Components/ArtistDashboard/DashboardOverview";
import WalletPage from "./Components/ArtistDashboard/WalletPage";
import ReleasesPage from "./Components/ArtistDashboard/ReleasesPage";
import ArtistProfileForm from "./Components/ArtistDashboard/ArtistProfileForm";
import Index from "./Components/ReleaseBuilder/Index";
import CollaborationsDashboard from "./Components/ArtistDashboard/CollaborationsDashboard";
import TicketList from "./Components/ArtistDashboard/TicketList";
import NewTicket from "./Components/ArtistDashboard/TicketCreationForm";
import TicketThread from "./Components/TicketThread";

//Admin routes
import AdminOverview from "./Components/AdminComponents/AdminOverview";
import UserManagement from "./Components/AdminComponents/UserManagement";
import ReleaseApprovalQueue from "./Components/AdminComponents/ReleaseApprovalQueue";
import WithdrawalManager from "./Components/AdminComponents/WithdrawalManager";
import ActivityLog from "./Components/AdminComponents/ActivityLog";
import AdminTickets from "./Components/AdminComponents/AdminTickets";
import SmartlinkDashboard from "./Components/AdminComponents/SmartlinkDashboard";
import AdminCreateSmartlink from "./Components/AdminComponents/AdminCreateSmartlink";

//Auth Pages
import { useUserStore } from "./store/useUserStore";
import "./App.css";
import { Toaster } from "react-hot-toast";

// 1. We create a sub-component to handle the layout logic
const AppContent = () => {
  const { user, checkingAuth } = useUserStore(); // 👈 Pull checkingAuth
  const location = useLocation();

  // 🚀 STOP EVERYTHING if we are still checking the session
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#B6B09F]"></div>
      </div>
    );
  }

  const AuthRedirect = () => {
    const { user } = useUserStore();
    if (!user) return <Login />;
    return user.role === "admin" ? (
      <Navigate to="/admin" />
    ) : (
      <Navigate to="/dashboard" />
    );
  };

  // Check if the current path starts with /dashboard
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isAdmin = location.pathname.startsWith("/admin");

  const isPortal = isDashboard || isAdmin;

  return (
    <div className="min-h-screen flex flex-col">
      {/* 2. Only show Header if we are NOT on a dashboard route */}
      {!isPortal && <Header />}

      <main className="flex-grow">
        <Layout>
          <Routes>
            <Route path="/" element={<Homepage />} />

            <Route path="/share/:slug" element={<SmartlinkPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/login"
              element={<AuthRedirect />} // Redirect logged in users to dashboard
            />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/signup"
              element={<Signup />} // Redirect logged in users to dashboard
            />

            {/* Admin Portal Routes - Protected by AdminRoute */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              {/* The 'index' route renders at exactly /admin */}
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="releases" element={<ReleaseApprovalQueue />} />
              <Route path="withdrawals" element={<WithdrawalManager />} />
              <Route path="logs" element={<ActivityLog />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="smartlink" element={<SmartlinkDashboard />} />
              <Route
                path="smartlink/create/:releaseId"
                element={<AdminCreateSmartlink />}
              />
              <Route
                path="tickets/:id"
                element={<TicketThread isAdminView={true} />}
              />
            </Route>

            <Route
              path="smartlink/create-smartlink"
              element={
                <ProtectedRoute>
                  <CreateSmartlink />
                </ProtectedRoute>
              }
            />

            <Route
              path="smartlink/analytics"
              element={
                <ProtectedRoute>
                  <IsrcAnalyticsDashboard />
                </ProtectedRoute>
              }
            />

            {/* Artist Portal Routes - Protected */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardOverview />} />
              <Route path="profile" element={<ArtistProfileForm />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route
                path="collaborations"
                element={<CollaborationsDashboard />}
              />
              <Route path="tickets" element={<TicketList />} />
              <Route path="tickets/new" element={<NewTicket />} />
              <Route path="tickets/:id" element={<TicketThread />} />
              <Route path="releases" element={<ReleasesPage />} />
              <Route path="releases/new" element={<Index />} />
              <Route path="releases/edit/:id" element={<Index />} />
            </Route>

            {/* Catch-all route at absolute bottom */}
            <Route path="*" element={<Navigate to={"/"} />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/docs/:slug" element={<ArticleDetail />} />
          </Routes>
        </Layout>
      </main>

      {/* 3. Only show Footer if we are NOT on a dashboard route */}
      {!isPortal && <Footer />}
      <Toaster />
      <CookieConsent />
    </div>
  );
};

// 4. App component just wraps everything in the Router
const App = () => {
  const { checkAuth } = useUserStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
