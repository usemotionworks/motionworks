import express from "express";
import {
  getPendingWithdrawals,
  processWithdrawal,
  getAllUsers,
  verifyUserManually,
  getPendingReleases,
  processRelease,
  getAdminStats,
  getAuditLogs,
  getDistributedReleases,
  processTakedown,
  getPendingTakedowns
} from "../controllers/adminController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", protect, admin, getAdminStats);

// Existing Withdrawal Routes
router.get("/withdrawals", protect, admin, getPendingWithdrawals);
router.put("/withdrawals/:id", protect, admin, processWithdrawal);

// 🚀 New User Management Routes
router.get("/users", protect, admin, getAllUsers);
router.put("/users/:id/verify", protect, admin, verifyUserManually);

// 🚀 New Release Queue Routes
router.get("/releases", protect, admin, getPendingReleases);
router.get("/releases/takedowns", protect, admin, getPendingTakedowns);
router.get("/distributed-releases", protect, admin, getDistributedReleases);

router.put("/releases/:id", protect, admin, processRelease);
router.put("/releases/:id/takedown", protect, admin, processTakedown);

router.get("/audit-logs", protect, admin, getAuditLogs);

export default router;
