
import crypto from "crypto";

const COOKIE_NAME = "presave_guest";
const SESSION_DURATION = 180 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_DURATION,
};

export const ensurePreSaveGuestSession = (req, res, next) => {
  try {
    let guestId = req.cookies?.[COOKIE_NAME];

    // Accept only IDs generated in the expected format.
    const isValidGuestId =
      typeof guestId === "string" &&
      /^[a-f0-9]{64}$/.test(guestId);

    if (!isValidGuestId) {
      guestId = crypto.randomBytes(32).toString("hex");

      res.cookie(COOKIE_NAME, guestId, cookieOptions);
    }

    req.guestId = guestId;

    return next();
  } catch (error) {
    console.error("Pre-save guest session error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to initialize guest session.",
    });
  }
};
