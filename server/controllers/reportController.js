import Report, { ALLOWED_DSPS } from "../models/Report.js";
import AuditLog from "../models/AuditLog.js";
//import { normalizeCountry } from "../utils/countryHelper.js";

import mongoose from "mongoose";
import Release from "../models/Release.js";
import { syncReportEarnings } from "../service/walletService.js";


export const saveMonthlyReport = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      reportId,
      releaseId,
      reportMonth,
      status = "draft",
      totalStreams,
      totalConsumptionUnits,
      totalRevenueUsd,
      tracks,
      dspBreakdown,
      channelBreakdown,
    } = req.body;

    if (!releaseId || !reportMonth) {
      return res.status(400).json({
        error: "Missing required fields: releaseId and reportMonth are required.",
      });
    }

    if (!mongoose.isValidObjectId(releaseId)) {
      return res.status(400).json({
        error: "Invalid releaseId.",
      });
    }

    if (
      reportId &&
      !mongoose.isValidObjectId(reportId)
    ) {
      return res.status(400).json({
        error: "Invalid reportId.",
      });
    }

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(reportMonth)) {
      return res.status(400).json({
        error: "Invalid reportMonth. Expected YYYY-MM.",
      });
    }

    if (!["draft", "submitted"].includes(status)) {
      return res.status(400).json({
        error: "Invalid report status.",
      });
    }

    const revenue = Number(totalRevenueUsd ?? 0);
    const streams = Number(totalStreams ?? 0);
    const consumption = Number(totalConsumptionUnits ?? 0);

    if (
      !Number.isFinite(revenue) ||
      revenue < 0 ||
      !Number.isFinite(streams) ||
      streams < 0 ||
      !Number.isFinite(consumption) ||
      consumption < 0
    ) {
      return res.status(400).json({
        error: "Revenue, streams and consumption must be non-negative numbers.",
      });
    }

    if (
      tracks !== undefined &&
      !Array.isArray(tracks)
    ) {
      return res.status(400).json({
        error: "Tracks must be an array.",
      });
    }

    if (
      dspBreakdown !== undefined &&
      !Array.isArray(dspBreakdown)
    ) {
      return res.status(400).json({
        error: "DSP breakdown must be an array.",
      });
    }

    if (
      channelBreakdown !== undefined &&
      !Array.isArray(channelBreakdown)
    ) {
      return res.status(400).json({
        error: "Channel breakdown must be an array.",
      });
    }

    const formattedDsp = (dspBreakdown || []).map((item) => ({
      dspName: item.dspName || item.name,
      streams: item.streams ?? 0,
      consumptionUnits: item.consumptionUnits ?? 0,
      revenueUsd: item.revenueUsd ?? 0,
    }));

    const formattedChannels = (channelBreakdown || []).map(
      (item) => ({
        channel:
          item.channel || item.channelName || item.name,
        streams: item.streams ?? 0,
        consumptionUnits: item.consumptionUnits ?? 0,
        revenueUsd: item.revenueUsd ?? 0,
      })
    );

    let savedReport;

    await session.withTransaction(async () => {
      // Verify that the release exists.
      const release = await Release.findById(releaseId)
        .session(session)
        .select("_id releaseOwner");

      if (!release) {
        throw new Error("RELEASE_NOT_FOUND");
      }

      let existingReport;

      if (reportId) {
        existingReport = await Report.findById(reportId)
          .session(session);

        if (!existingReport) {
          throw new Error("REPORT_NOT_FOUND");
        }

        // Prevent changing the release/month of an existing report.
        if (
          existingReport.releaseId.toString() !== releaseId ||
          existingReport.reportMonth !== reportMonth
        ) {
          throw new Error(
            "A report's release and month cannot be changed."
          );
        }
      } else {
        existingReport = await Report.findOne({
          releaseId,
          reportMonth,
        }).session(session);
      }

      const query = existingReport
        ? { _id: existingReport._id }
        : { releaseId, reportMonth };

      const updateData = {
        releaseId,
        reportMonth,
        status,
        totalStreams: streams,
        totalConsumptionUnits: consumption,
        totalRevenueUsd: revenue,
        tracks: tracks || [],
        dspBreakdown: formattedDsp,
        channelBreakdown: formattedChannels,
        lastUpdatedMonth: reportMonth,
        updatedBy: req.user?._id,
      };

      savedReport = await Report.findOneAndUpdate(
        query,
        { $set: updateData },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
          session,
        }
      );

      // Only credit the wallet for an authenticated admin action.
      if (!req.user?._id) {
        throw new Error("AUTHENTICATION_REQUIRED");
      }

      // Use the actual release owner as the wallet owner.
      await syncReportEarnings({
        userId: release.releaseOwner,
        reportId: savedReport._id,
        grossRevenueUsd: savedReport.totalRevenueUsd,
        status: savedReport.status,
        session,
      });

      await AuditLog.create(
        [
          {
            adminId: req.user._id,
            action: `Report for ${savedReport._id}`,
            targetId: savedReport._id,
            targetModel: "Report",
            changes: {
              method: "Manual Admin Update",
              status,
            },
            ipAddress: req.ip,
          },
        ],
        { session }
      );
    });

    return res.status(200).json({
      message:
        status === "draft"
          ? "Draft saved successfully!"
          : "Report submitted successfully!",
      report: savedReport,
    });
  } catch (error) {
    console.error("Report Save Error:", error);

    const knownErrors = {
      RELEASE_NOT_FOUND: [404, "Release not found."],
      REPORT_NOT_FOUND: [404, "Report not found."],
      AUTHENTICATION_REQUIRED: [401, "Authentication required."],
    };

    if (knownErrors[error.message]) {
      const [statusCode, message] = knownErrors[error.message];
      return res.status(statusCode).json({ error: message });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        error: "A report already exists for this release and month.",
      });
    }

    return res.status(500).json({
      error: error.message || "Failed to save report.",
    });
  } finally {
    await session.endSession();
  }
};

// Fetch reports with sorting by month / last updated
// controllers/reportController.js
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate("releaseId", "title artwork primaryArtists upc releaseType tracks")
      .sort({ reportMonth: -1, createdAt: -1 });

    // Returns [] if empty, or array of documents
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSupportedDsps = (req, res) => {
  return res.json({ success: true, dsps: ALLOWED_DSPS });
};


export const getExistingReports = async (req, res) => {
  try {
    const reports = await Report.find({
      releaseId: req.params.releaseId,
    }).sort({ reportMonth: -1 });

    if (!reports || reports.length === 0) {
      return res.status(200).json({
        totals: {
          totalStreams: 0,
          totalConsumptionUnits: 0,
          totalRevenueUsd: 0,
        },
        latestReport: null,
        reports: [],
      });
    }

    // The reports are sorted newest first,
    // so the first report is the most recent statement.
    const latestReport = reports[0];

    // Use ONLY the most recent report for the release summary.
    const totals = {
      totalStreams: latestReport.totalStreams || 0,
      totalConsumptionUnits: latestReport.totalConsumptionUnits || 0,
      totalRevenueUsd: latestReport.totalRevenueUsd || 0,
    };

    res.status(200).json({
      totals,
      latestReport,
      reports,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching release reports",
      error: error.message,
    });
  }
};
