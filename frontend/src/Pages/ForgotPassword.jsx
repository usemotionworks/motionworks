import { useState } from "react";
import { Link } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";
import { motion } from "framer-motion";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const { forgotPassword, loading } = useUserStore();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await forgotPassword(email);
    if (success) setSubmitted(true);
  };

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
            Forgot Password
          </h2>
          <p className="text-[#B6B09F] mt-2 font-light">
            We'll send a secure link to reset your password.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[#EAE4D5] text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-[#B6B09F]/40 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] focus:outline-none transition-colors"
                placeholder="artist@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#EAE4D5] text-[#0a0a0a] font-bold rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-[#B6B09F] mb-6">
              If an account exists for {email}, you'll receive an email shortly.
            </p>
            <Link
              to="/login"
              className="text-[#EAE4D5] font-medium hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
