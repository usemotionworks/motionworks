import express from "express";
import multer from "multer";
import {
  getPresignedUrl,
  createRelease,
  getUserReleases,
  uploadArtwork,
  getReleaseById,
  takedownSong
} from "../controllers/releaseController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit matching your frontend
});

// -----------------------------------------------------
// UPLOAD ROUTES
// -----------------------------------------------------
// POST /api/users/get-presigned-url
router.post("/get-presigned-url", protect, getPresignedUrl);

// 2. Artwork direct upload (Expecting field name "artwork")
router.post(
  "/release-artwork",
  protect,
  upload.single("artwork"),
  uploadArtwork,
);
// -----------------------------------------------------
// RELEASE ROUTES
// -----------------------------------------------------
// POST /api/users/releases - Submit new release
// GET  /api/users/releases - View dashboard releases
router.route("/").post(protect, createRelease).get(protect, getUserReleases);



// GET /api/users/releases/:id - View release details
router.get("/:id", protect, getReleaseById);
//POST
router.patch('/:id/takedown', protect, takedownSong)

export default router;
