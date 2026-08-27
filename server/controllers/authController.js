import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  sendVerificationEmail,
  sendForgotPasswordEmail,
} from "../utils/emailService.js";

// @desc    Register a new artist/user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { legalName, stageName, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Generate hex token for verification
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  const user = await User.create({
    legalName,
    stageName,
    email,
    password,
    verificationToken,
    verificationTokenExpires,
  });

  if (user) {
    // Send Resend email
    try {
      await sendVerificationEmail(
        user.email,
        user.stageName || user.legalName,
        verificationToken,
      );
    } catch (emailError) {
      console.error("Failed to send verification email", emailError);
      // We still create the user but let them know email failed
    }

    res.status(201).json({
      message:
        "Registration successful! Please check your email to verify your account.",
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    // 🛑 Block login if they haven't verified their email yet!
    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: "Please verify your email before logging in." });
    }

    generateToken(res, user._id);
    res.status(200).json({
      _id: user._id,
      legalName: user.legalName,
      stageName: user.stageName,
      email: user.email,
      role: user.role,
      walletBalanceNGN: user.walletBalanceNGN,
      walletBalanceUSD: user.walletBalanceUSD,
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
};
// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0), // Sets expiration to the past to kill it
    secure: true, // 🚀 MUST be true in production
    sameSite: "lax", // 🚀 MUST match your login setting
    domain: isProduction ? ".usemotionworks.com" : undefined, // 🚀 MUST match login domain
  });

  res.status(200).json({ message: "Logged out successfully" });
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Please login again" });
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Generate a fresh access token
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );

    // Send it back in a secure cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only true on Render
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.error("Error in refreshToken", error.message);
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.body;

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res
      .status(400)
      .json({ message: "Invalid or expired verification token." });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res
    .status(200)
    .json({ message: "Email verified successfully! You can now log in." });
};

// @desc    Forgot Password - Send Email
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    // For security reasons, don't reveal that the user doesn't exist
    return res.status(200).json({
      message:
        "If that email exists in our system, a reset link has been sent.",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  try {
    await sendForgotPasswordEmail(user.email, resetToken);
  } catch (error) {
    console.error("Forgot password email failed", error);
  }

  res.status(200).json({
    message: "If that email exists in our system, a reset link has been sent.",
  });
};

// @desc    Reset Password
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res
      .status(400)
      .json({ message: "Invalid or expired password reset link." });
  }

  user.password = password; // Pre-save hook will hash this!
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpires = undefined;
  await user.save();

  res
    .status(200)
    .json({ message: "Password reset successful. You can now log in." });
};
