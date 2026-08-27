import express from "express";
import { requestPayout, payoutHistory } from "../controllers/walletController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/request", protect, requestPayout);
router.get("/history", protect, payoutHistory);


export default router;
