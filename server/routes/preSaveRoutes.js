import express from "express";

import {
  createArtistCampaign,
  createAdminCampaign,
  getArtistCampaigns,
  getCampaignForManagement,
  updateCampaign,
  cancelCampaign,
  getPublicCampaign,
} from "../controllers/preSaveController.js";

import {
  protect,
  admin,
} from "../middleware/authMiddleware.js";


import { ensurePreSaveGuestSession } from "../middleware/preSaveGuestSession.js";

import {
  getGuestSession,
} from "../controllers/preSaveGuestController.js";

import {
  connectSpotify,
  spotifyCallback,
} from "../controllers/preSaveSpotifyController.js";



const router = express.Router();

router.get(
  "/session",
  ensurePreSaveGuestSession,
  getGuestSession
);

router.get(
  "/spotify/connect",
  ensurePreSaveGuestSession,
  connectSpotify
);

router.get(
  "/spotify/callback",
  ensurePreSaveGuestSession,
  spotifyCallback
);

router.post("/artist", protect, createArtistCampaign);
router.get("/artist", protect, getArtistCampaigns);

router.post("/admin", protect, admin, createAdminCampaign);

router.get("/public/:slug", getPublicCampaign);

router.get("/:id/manage", protect, getCampaignForManagement);
router.patch("/:id", protect, updateCampaign);
router.patch("/:id/cancel", protect, cancelCampaign);

export default router;
