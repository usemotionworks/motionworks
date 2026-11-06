import { useEffect, useState, useRef } from "react"; // 👈 Add useRef
import { useSearchParams, Link } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";
import { motion } from "framer-motion";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { verifyEmail } = useUserStore();

  const [status, setStatus] = useState("loading");
  // 1. Create a ref to track if we've already sent the request
  const verificationStarted = useRef(false);

  useEffect(() => {
    const handleVerify = async () => {
      // 2. Check if already started or no token
      if (!token || verificationStarted.current) return;

      // 3. Mark as started immediately
      verificationStarted.current = true;

      const success = await verifyEmail(token);
      setStatus(success ? "success" : "error");
    };

    handleVerify();
  }, [token, verifyEmail]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0a0a] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 bg-[#050505] border border-[#B6B09F]/20 rounded-xl shadow-2xl text-center"
      >
        {status === "loading" && (
          <div className="py-8">
            <FaSpinner className="text-4xl text-[#B6B09F] animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#EAE4D5] mb-2">
              Verifying Email
            </h2>
            <p className="text-[#B6B09F] font-light">
              Please hold on while we confirm your account.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="py-8">
            <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#EAE4D5] mb-2">
              Account Verified!
            </h2>
            <p className="text-[#B6B09F] font-light mb-6">
              Your email has been confirmed. You can now access the portal.
            </p>
            <Link
              to="/login"
              className="px-6 py-3 bg-[#EAE4D5] text-[#0a0a0a] font-bold rounded-lg hover:bg-opacity-90 transition-all"
            >
              Proceed to Login
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="py-8">
            <FaTimesCircle className="text-4xl text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#EAE4D5] mb-2">
              Verification Failed
            </h2>
            <p className="text-[#B6B09F] font-light mb-6">
              The link is either invalid or has expired.
            </p>
            <Link
              to="/signup"
              className="text-[#EAE4D5] font-medium hover:underline"
            >
              Try signing up again
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
