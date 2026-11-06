import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  signup: async ({
    legalName,
    stageName,
    email,
    password,
    confirmPassword,
  }) => {
    set({ loading: true });

    if (password !== confirmPassword) {
      set({ loading: false });
      toast.error("Passwords do not match");
      return false;
    }

    try {
      const res = await axios.post("api/auth/register", {
        legalName,
        stageName,
        email,
        password,
      });
      set({ loading: false });
      // Show success message from backend telling them to check email
      toast.success(
        res.data.message || "Please check your email to verify your account!",
      );
      return true;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "An error occurred");
      return false;
    }
  },

  // 📩 NEW: Verify Email
  verifyEmail: async (token) => {
    set({ loading: true });
    try {
      const res = await axios.post("api/auth/verify-email", { token });
      set({ loading: false });
      toast.success(res.data.message);
      return true;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Verification failed");
      return false;
    }
  },

  // 📩 NEW: Forgot Password
  forgotPassword: async (email) => {
    set({ loading: true });
    try {
      const res = await axios.post("api/auth/forgot-password", { email });
      set({ loading: false });
      toast.success(res.data.message);
      return true;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Password reset failed");
      return false;
    }
  },

  // 📩 NEW: Reset Password
  resetPassword: async (token, password) => {
    set({ loading: true });
    try {
      const res = await axios.post("api/auth/reset-password", {
        token,
        password,
      });
      set({ loading: false });
      toast.success(res.data.message);
      return true;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Password reset failed");
      return false;
    }
  },

  verifyBvn: async (bvnData) => {
    set({ loading: true });
    try {
      const res = await axios.post("api/users/verify-bvn", { bvn: bvnData });

      set((state) => ({
        user: {
          ...state.user,
          // Safely update the nested verification object
          verification: {
            ...(state.user.verification || {}),
            status: res.data.verificationStatus,
          },
        },
        loading: false,
      }));

      toast.success(res.data.message);
      return true;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Verification failed");
      return false;
    }
  },

  // Inside useUserStore.js
  login: async (email, password) => {
    set({ loading: true, error: null }); // Reset error and start loading
    try {
      const res = await axios.post("/api/auth/login", {
        email,
        password,
      });
      set({ user: res.data, loading: false });
      return true;
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      set({ error: message, loading: false }); // 🚀 THIS MUST RUN
      return false;
    } finally {
      set({ loading: false }); // 🛡️ DOUBLE SAFETY: Always stops the spinner
    }
  },

  logout: async (navigate) => {
    // 🚀 Accept navigate as an argument
    try {
      await axios.post("api/auth/logout");
      set({ user: null });

      if (navigate) {
        navigate("/login"); // 🚀 Explicitly force move to login
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  },

  checkAuth: async () => {
    //console.log("Starting auth check");
    try {
      const response = await axios.get("api/users/profile");
      // console.log("Auth check successful", response.data);
      set({ user: response.data, checkingAuth: false });
    } catch (error) {
      // console.log("Auth check failed", error.message);
      set({ checkingAuth: false, user: null });
    }
  },
  refreshToken: async () => {
    // Prevent multiple simultaneous refresh attempts
    if (get().checkingAuth) return;

    set({ checkingAuth: true });
    try {
      const response = await axios.post("api/auth/refresh-token");
      set({ checkingAuth: false });
      return response.data;
    } catch (error) {
      set({ user: null, checkingAuth: false });
      throw error;
    }
  },
}));

// TODO: Implement the axios interceptors for refreshing access token

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 🚀 NEW: Don't try to refresh if the error happened during Login or Refreshing itself
    const isAuthRequest =
      originalRequest.url.includes("api/auth/login") ||
      originalRequest.url.includes("api/auth/refresh-token");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      try {
        if (refreshPromise) {
          await refreshPromise;
          return axios(originalRequest);
        }

        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;

        return axios(originalRequest);
      } catch (refreshError) {
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    // 🚀 CRITICAL: If it's a login 401, just reject it so the 'catch' in login() runs!
    return Promise.reject(error);
  },
);
