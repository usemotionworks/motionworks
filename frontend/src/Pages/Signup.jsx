import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

const Signup = () => {
  const [formData, setFormData] = useState({
    legalName: "",
    stageName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const navigate = useNavigate();
  const { signup, loading } = useUserStore();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      await signup(formData);
      toast.success("Welcome to the roster!");
      navigate("/dashboard");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0a0a] px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg p-8 bg-[#050505] border border-[#B6B09F]/20 rounded-xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#EAE4D5] tracking-tight">
            Join the Roster
          </h2>
          <p className="text-[#B6B09F] mt-2 font-light">
            Create your account to start distributing your sound.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ... Name fields remain same ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[#EAE4D5] text-sm font-medium mb-2">
                Legal Name <span className="text-[#B6B09F] text-xs">(should match BVN)</span>
              </label>
              <input
                type="text"
                name="legalName"
                value={formData.legalName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-transparent border border-[#B6B09F]/40 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] focus:outline-none transition-colors"
                placeholder="Should match BVN"
                required
              />
            </div>
            <div>
              <label className="block text-[#EAE4D5] text-sm font-medium mb-2">
                Stage Name
              </label>
              <input
                type="text"
                name="stageName"
                value={formData.stageName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-transparent border border-[#B6B09F]/40 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] focus:outline-none transition-colors"
                placeholder="Artist Moniker"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[#EAE4D5] text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-transparent border border-[#B6B09F]/40 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] focus:outline-none transition-colors"
              placeholder="artist@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Password */}
            <div className="relative">
              <label className="block text-[#EAE4D5] text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-transparent border border-[#B6B09F]/40 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] focus:outline-none transition-colors pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B6B09F]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <label className="block text-[#EAE4D5] text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-transparent border border-[#B6B09F]/40 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] focus:outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* ... Terms and Submit button ... */}
          <div className="flex items-start gap-3 py-2">
            <input
              id="terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-[#B6B09F]/40 bg-transparent text-[#B6B09F] focus:ring-0 cursor-pointer"
              required
            />
            <label
              htmlFor="terms"
              className="text-xs text-[#B6B09F] leading-tight"
            >
              I have read and agree to the{" "}
              <Link
                to="/terms"
                className="text-[#EAE4D5] underline hover:text-white"
              >
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-[#EAE4D5] underline hover:text-white"
              >
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            className="w-full py-4 bg-[#EAE4D5] text-[#0a0a0a] font-bold rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-widest text-xs"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-[#B6B09F] text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#EAE4D5] font-medium hover:underline"
          >
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
