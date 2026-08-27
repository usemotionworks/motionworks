import Report, { ALLOWED_DSPS } from "../models/Report.js";
import AuditLog from "../models/AuditLog.js";
//import { normalizeCountry } from "../utils/countryHelper.js";


// Upsert monthly report
export const saveMonthlyReport = async (req, res) => {
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
      updatedBy,
    } = req.body;

    if (!releaseId || !reportMonth) {
      return res.status(400).json({
        error: "Missing required fields: releaseId and reportMonth are required.",
      });
    }

    // Map DSP breakdown to match Mongoose schema (dspName)
    const formattedDsp = (dspBreakdown || []).map((item) => ({
      dspName: item.dspName || item.name,
      streams: item.streams || 0,
      consumptionUnits: item.consumptionUnits || 0,
      revenueUsd: item.revenueUsd || 0,
    }));

    // Map Channel breakdown to match Mongoose schema key (channel)
    const formattedChannels = (channelBreakdown || []).map((item) => ({
      channel: item.channel || item.channelName || item.name,
      streams: item.streams || 0,
      consumptionUnits: item.consumptionUnits || 0,
      revenueUsd: item.revenueUsd || 0,
    }));

    const query = reportId ? { _id: reportId } : { releaseId, reportMonth };

    const updateData = {
      releaseId,
      reportMonth,
      status,
      totalStreams: totalStreams || 0,
      totalConsumptionUnits: totalConsumptionUnits || 0,
      totalRevenueUsd: totalRevenueUsd || 0,
      tracks: tracks || [],
      dspBreakdown: formattedDsp,
      channelBreakdown: formattedChannels,
      lastUpdatedMonth: reportMonth,
      updatedBy: updatedBy || req.user?._id,
    };

    const report = await Report.findOneAndUpdate(query, updateData, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });

    if (req.user?._id) {
      await AuditLog.create({
        adminId: req.user._id,
        action: `Report for ${reportId || releaseId}`,
        targetId: report._id,
        targetModel: "Report",
        changes: { method: "Manual Admin Update", status },
        ipAddress: req.ip,
      });
    }

    return res.status(200).json({
      message:
        status === "draft"
          ? "Draft saved successfully!"
          : "Report submitted successfully!",
      report,
    });
  } catch (error) {
    console.error("Report Save Error:", error);
    return res.status(500).json({ error: error.message || "Failed to save report" });
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
    const reports = await Report.find({ releaseId: req.params.releaseId })
      .sort({ reportMonth: -1 });

    if (!reports || reports.length === 0) {
      return res.status(200).json({
        totals: { totalStreams: 0, totalConsumptionUnits: 0, totalRevenueUsd: 0 },
        reports: [],
      });
    }

    // Calculate overall release totals across all monthly reports
    const totals = reports.reduce(
      (acc, curr) => {
        acc.totalStreams += curr.totalStreams || 0;
        acc.totalConsumptionUnits += curr.totalConsumptionUnits || 0;
        acc.totalRevenueUsd += curr.totalRevenueUsd || 0;
        return acc;
      },
      { totalStreams: 0, totalConsumptionUnits: 0, totalRevenueUsd: 0 }
    );

    res.status(200).json({ totals, reports });
  } catch (error) {
    res.status(500).json({ message: "Error fetching release reports", error: error.message });
  }
};
