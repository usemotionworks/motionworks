import { Router } from "express";
import { saveMonthlyReport, getReports, getExistingReports } from "../controllers/reportController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { getUserWalletSummary } from "../controllers/walletController.js";


const router = Router();

router.post("/", protect, admin, saveMonthlyReport);
router.get("/", protect, admin, getReports);
router.get("/wallet-summary", protect, getUserWalletSummary);
router.get("/:releaseId", protect, getExistingReports);



export default router;
