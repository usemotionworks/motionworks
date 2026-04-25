// server.js
import dotenv from "dotenv";
import cron from "node-cron";

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

//Routes
import authRoutes from "./routes/authRoutes.js";
import royaltyRoutes from "./routes/royaltyRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import scoutRoutes from "./routes/scoutRoutes.js";
import releaseRoutes from "./routes/releaseRoutes.js";
import collaborationsRoutes from "./routes/collaborations.js";
import ticketRoutes from "./routes/ticketRoutes.js";

//Error Middleware
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
dotenv.config();

//Tests

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = [
  "https://usemotionworks.com",
  "https://www.usemotionworks.com",
  "http://localhost:5173", // for local dev
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  }),
);

app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

cron.schedule("0 0 * * *", async () => {
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

  await Ticket.updateMany(
    {
      status: "resolved",
      resolvedAt: { $lte: tenDaysAgo },
    },
    { status: "closed" },
  );
  console.log("Cleanup: Closed tickets resolved over 10 days ago.");
});

app.use("/api/", limiter);

// --- Database Connection ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to Horme OS Database"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// --- Basic Route ---
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "active", message: "Horme OS Engine Running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/royalties", royaltyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/scouts", scoutRoutes);
app.use("/api/releases", releaseRoutes);
app.use("/api/collaborations", collaborationsRoutes);
app.use("/api/tickets", ticketRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
