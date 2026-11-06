import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

export const protect = async (req, res, next) => {
  const token = req.cookies?.jwt;

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, no token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Not authorized, user no longer exists",
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, token failed",
    });
  }
};


export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as admin" });
  }
};

// Example: After rejecting a release
export const logAdminAction = async (req, action, targetId, changes = {}) => {
  try {
    await AuditLog.create({
      adminId: req.user._id, // Assumes user is attached via auth middleware
      action,
      targetId,
      changes,
      ipAddress: req.ip || req.headers["x-forwarded-for"],
      userAgent: req.get("User-Agent"),
    });
  } catch (error) {
    console.error("CRITICAL: Failed to write audit log:", error);
    // You don't want to crash the app, but you should alert yourself here
  }
};
