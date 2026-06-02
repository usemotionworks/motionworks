import mongoose from "mongoose";
import { SmartlinkAnalytics } from "../models/smartlink.js";

export const getSmartlinkSummary = async (smartlinkId) => {
  const objectId = new mongoose.Types.ObjectId(smartlinkId);

  // PLATFORM BREAKDOWN
  const platformBreakdown = await SmartlinkAnalytics.aggregate([
    {
      $match: {
        smartlinkId: objectId,
      },
    },
    {
      $group: {
        _id: "$platform",
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
  ]);

  // COUNTRY BREAKDOWN
  const countryBreakdown = await SmartlinkAnalytics.aggregate([
    {
      $match: {
        smartlinkId: objectId,
      },
    },
    {
      $group: {
        _id: "$location.country",
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
    {
      $limit: 10,
    },
  ]);

  // DEVICE TYPES
  const deviceBreakdown = await SmartlinkAnalytics.aggregate([
    {
      $match: {
        smartlinkId: objectId,
      },
    },
    {
      $group: {
        _id: "$device.type",
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
  ]);

  // OPERATING SYSTEMS
  const osBreakdown = await SmartlinkAnalytics.aggregate([
    {
      $match: {
        smartlinkId: objectId,
      },
    },
    {
      $group: {
        _id: "$device.os",
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
  ]);

  // BROWSERS / WEBVIEWS
  const browserBreakdown = await SmartlinkAnalytics.aggregate([
    {
      $match: {
        smartlinkId: objectId,
      },
    },
    {
      $group: {
        _id: "$device.browser",
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
  ]);

  // REFERRERS
  const referrerBreakdown = await SmartlinkAnalytics.aggregate([
    {
      $match: {
        smartlinkId: objectId,
      },
    },
    {
      $group: {
        _id: "$referrer",
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
  ]);

  // RECENT ACTIVITY
  const recentActivity = await SmartlinkAnalytics.find({
    smartlinkId: objectId,
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .select("platform location.country device.type createdAt");

  return {
    platforms: platformBreakdown,
    countries: countryBreakdown,

    devices: deviceBreakdown,
    operatingSystems: osBreakdown,
    browsers: browserBreakdown,

    referrers: referrerBreakdown,

    recentActivity,
  };
};
