import express from "express";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";
import { Smartlink, SmartlinkAnalytics } from "../models/smartlink.js";
import { protect } from "../middleware/authMiddleware.js";
import { getSmartlinkSummary } from "../controllers/smartlinkController.js";
import spotifyApi from "../utils/spotify.js";
import { resolveSpotifyEntity } from "../utils/resolvers/spotifyResolver.js";
import { runResolvers } from "../services/resolverPipeline.js";
import Release from "../models/Release.js";

const router = express.Router();

// GET /api/smartlink/lookup?isrc=USUM71607007
// Helper function to search Apple Music / iTunes

router.get("/", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: "Spotify URL is required",
      });
    }

    // STEP 1: CREATE ENTITY
    const entity = await resolveSpotifyEntity(url, spotifyApi);

    // STEP 2: RUN DSP RESOLVERS
    //

    const resolverResults = await runResolvers(entity);

    // STEP 3: AGGREGATE
    const links = {};

    resolverResults.forEach((result) => {
      links[result.platform] = result.url;

      if (result.appleMusicUrl) {
        links.appleMusic = result.appleMusicUrl;
      }

      if (result.itunesStoreUrl) {
        links.itunes = result.itunesStoreUrl;
      }

      if (result.youtubeMusicUrl) {
        links.youtubeMusic = result.youtubeMusicUrl;
      }
    });

    return res.json({
      success: true,

      ...entity,

      links,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Metadata fetch failed",
    });
  }
});

// POST /api/v1/smartlinks/create
router.post("/create", protect, async (req, res) => {
  try {
    const {
      isrc,
      title,
      artistName,
      coverArt,
      slug,
      links,
      releaseId,
      externalId,
    } = req.body;

    // Validate release
    const release = await Release.findById(releaseId);

    if (!release) {
      return res.status(404).json({
        error: "Release not found",
      });
    }

    // Permissions
    const isOwner = release.releaseOwner.toString() === req.user.id;

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: "Unauthorized",
      });
    }

    // Distributed check
    if (release.status !== "distributed" && !isAdmin) {
      return res.status(400).json({
        error: "Release must be distributed first",
      });
    }

    // Prevent duplicate smartlinks
    const existingReleaseSmartlink = await Smartlink.findOne({
      releaseId: release._id,
    });

    if (existingReleaseSmartlink) {
      return res.status(400).json({
        error: "A smartlink already exists for this release",
      });
    }

    // Prevent duplicate slugs
    const existingSlug = await Smartlink.findOne({
      slug,
    });

    if (existingSlug) {
      return res.status(400).json({
        error: "Slug already taken",
      });
    }

    // Create smartlink
    const newSmartlink = new Smartlink({
      artistId: release.releaseOwner,
      releaseId: release._id,
      isrc,
      title,
      artistName,
      coverArt,
      slug,
      links,
      upc: externalId,
    });

    await newSmartlink.save();
    await release.updateOne({
      smartlink: newSmartlink._id,
      isrc,
      upc: externalId,
    });
    return res.status(201).json({
      success: true,
      smartlinkId: newSmartlink._id,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create smartlink",
    });
  }
});

router.post("/track-click", async (req, res) => {
  try {
    const { smartlinkId, platform, targetUrl } = req.body;

    // 1. Fetch the smartlink settings
    const smartlink = await Smartlink.findById(smartlinkId);
    if (!smartlink)
      return res.status(404).json({ error: "Smartlink not found" });

    // 2. Parse User-Agent for Device Info
    const parser = new UAParser(req.headers["user-agent"]);
    const uaResult = parser.getResult();

    // 3. Resolve Geolocation from IP Address
    // Note: In local development, req.ip is often '::1' (localhost). In production on Render,
    // you will read the 'x-forwarded-for' header to get the fan's real public IP.
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const geo = geoip.lookup(ip);

    // 4. Build Log Data Payload
    const clickLog = new SmartlinkAnalytics({
      smartlinkId: smartlink._id,
      artistId: smartlink.artistId,
      platform: platform.toLowerCase().trim(),
      device: {
        type: uaResult.device.type || "desktop", // desktop is usually returned as undefined by parser
        os: uaResult.os.name || "unknown",
        browser: uaResult.browser.name || "unknown",
      },
      location: {
        countryCode: geo?.country || "Unknown",
        country: geo ? geoip.pretty(geo.country) : "Unknown", // Human readable country names
        region: geo?.region || "Unknown",
        city: geo?.city || "Unknown",
      },
      referrer: req.body.referrer || "direct",
    });

    // 5. Fire and forget saves to keep response fast
    await clickLog.save();

    // Atomically increment total metrics counters on the parent document
    await Smartlink.findByIdAndUpdate(smartlinkId, {
      $inc: { totalClicks: 1 },
    });

    // Return true or redirect right away
    return res.status(200).json({ success: true, redirect: targetUrl });
  } catch (error) {
    console.error("Analytics tracking failed:", error);
    return res.status(500).json({ error: "Failed to record log metric" });
  }
});

router.get("/by-isrc/:isrc", protect, async (req, res) => {
  try {
    const { isrc } = req.params;

    // Validate
    if (!isrc || isrc.trim().length < 5) {
      return res.status(400).json({
        error: "Invalid ISRC format structured code",
      });
    }

    const targetIsrc = isrc.toUpperCase().trim();

    // Fetch smartlink
    const smartlink = await Smartlink.findOne({
      isrc: targetIsrc,
    });

    if (!smartlink) {
      return res.status(404).json({
        error: `No active smartlink found matching ISRC: ${targetIsrc}`,
      });
    }

    // Fetch analytics
    let analytics = {
      platforms: [],
      countries: [],
      devices: [],
      browsers: [],
      referrers: [],
    };

    try {
      analytics = await getSmartlinkSummary(smartlink._id);
    } catch (pipelineError) {
      console.error(
        `[Analytics Pipeline Error] ${smartlink._id}`,
        pipelineError.message,
      );
    }

    // Unified response
    return res.status(200).json({
      success: true,

      meta: {
        smartlinkId: smartlink._id,
        slug: smartlink.slug,

        title: smartlink.title,
        artistName: smartlink.artistName,
        coverArt: smartlink.coverArt,

        totalClicks: smartlink.totalClicks || 0,

        createdAt: smartlink.createdAt,
      },

      links: smartlink.links || {},

      analytics,
    });
  } catch (error) {
    console.error("[Route Exception] GET /by-isrc failed:", error);

    return res.status(500).json({
      error: "Internal service error locating analytics dashboard profile",
    });
  }
});

router.get("/by-upc/:upc", protect, async (req, res) => {
  try {
    const { upc } = req.params;

    // Validate
    if (!upc || upc.trim().length < 5) {
      return res.status(400).json({
        error: "Invalid UPC format",
      });
    }

    const targetUpc = upc.toUpperCase().trim();

    // Fetch smartlink
    const smartlink = await Smartlink.findOne({
      upc: targetUpc,
    });

    if (!smartlink) {
      return res.status(404).json({
        error: `No active smartlink found matching UPC: ${targetUpc}`,
      });
    }

    // Fetch analytics
    let analytics = {
      platforms: [],
      countries: [],
      devices: [],
      browsers: [],
      referrers: [],
    };

    try {
      analytics = await getSmartlinkSummary(smartlink._id);
    } catch (pipelineError) {
      console.error(
        `[Analytics Pipeline Error] ${smartlink._id}`,
        pipelineError.message,
      );
    }

    // Unified response
    return res.status(200).json({
      success: true,

      meta: {
        smartlinkId: smartlink._id,
        slug: smartlink.slug,

        title: smartlink.title,
        artistName: smartlink.artistName,
        coverArt: smartlink.coverArt,

        totalClicks: smartlink.totalClicks || 0,

        createdAt: smartlink.createdAt,
      },

      links: smartlink.links || {},

      analytics,
    });
  } catch (error) {
    console.error("[Route Exception] GET /by-upc failed:", error);

    return res.status(500).json({
      error: "Internal service error locating analytics dashboard profile",
    });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const smartlink = await Smartlink.findOne({ slug });

    if (!smartlink) {
      return res.status(404).json({ error: "Smartlink not found" });
    }

    res.json(smartlink);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch smartlink" });
  }
});

export default router;
