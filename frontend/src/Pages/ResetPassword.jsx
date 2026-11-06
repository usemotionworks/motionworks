import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { resetPassword, loading } = useUserStore();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    const success = await resetPassword(token, password);
    if (success) navigate("/login");
  };

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0a0a] px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#EAE4D5] mb-2">
            Missing Token
          </h2>
          <p className="text-[#B6B09F] mb-4">
            You need a valid reset token to access this page.
          </p>
          <Link to="/login" className="text-[#EAE4D5] hover:underline">
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0a0a] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 bg-[#050505] border border-[#B6B09F]/20 rounded-xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#EAE4D5] tracking-tight">
            Create New Password
          </h2>
          <p className="text-[#B6B09F] mt-2 font-light">
            Enter a strong password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[#EAE4D5] text-sm font-medium mb-2">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-transparent border border-[#B6B09F]/40 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] focus:outline-none transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-[#EAE4D5] text-sm font-medium mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-transparent border border-[#B6B09F]/40 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] focus:outline-none transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#EAE4D5] text-[#0a0a0a] font-bold rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
