import Ticket from "../models/Tickets.js";
import {
  sendTicketCreatedEmail,
  sendTicketReplyEmail,
} from "../utils/emailService.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../utils/uploadFileToS3.js";
import crypto from "crypto";
import AuditLog from "../models/AuditLog.js";
import { notifyAdminNewTicket } from "../utils/slack.js";

export const createTicket = async (req, res) => {
  try {
    const { subject, description, category, attachments } = req.body;

    const ticket = await Ticket.create({
      user: req.user._id,
      subject,
      description,
      category,
      attachments, // URLs already uploaded to S3
    });

    await sendTicketCreatedEmail(
      req.user.stageName,
      req.user.email,
      ticket._id,
      subject,
    );

    notifyAdminNewTicket(
      `New Ticket: ${req.user.email}, Subject: ${subject}, Category: ${category}, Description: ${description}`,
    );

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Failed to create ticket" });
  }
};

// @desc Get active ticket count for badges
export const getActiveTicketCount = async (req, res) => {
  try {
    const count = await Ticket.countDocuments({
      user: req.user._id,
      status: { $in: ["open", "in-progress"] },
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching count" });
  }
};

// @desc Get user's tickets
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id }).sort({
      updatedAt: -1,
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tickets" });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("user", "stageName email")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Admin fetch failed" });
  }
};

export const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const bucketName = process.env.AWS_BUCKET_NAME;
    // Create a unique filename to prevent overwriting
    const uniqueSuffix = crypto.randomBytes(4).toString("hex");
    const fileKey = `support-attachments/${Date.now()}-${uniqueSuffix}-${req.file.originalname}`;

    const uploadParams = {
      Bucket: bucketName,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Construct the public URL
    const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    res.status(200).json({
      url,
      name: req.file.originalname,
    });
  } catch (error) {
    console.error("S3 Support Upload Error:", error);
    res.status(500).json({ message: "Failed to upload attachment to S3" });
  }
};

export const replyToTicket = async (req, res) => {
  try {
    const { message, attachmentUrl } = req.body;
    const { id } = req.params;

    const ticket = await Ticket.findById(id).populate("user");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const newMessage = {
      sender: req.user._id,
      message: message,
      isAdmin: req.user.role === "admin",
      attachments: attachmentUrl
        ? [{ url: attachmentUrl, name: req.body.fileName }]
        : [],
      createdAt: new Date(),
    };

    ticket.messages.push(newMessage);

    // If Admin replies, set status to 'in-progress'
    if (req.user.role === "admin") {
      ticket.status = "in-progress";
    }

    await ticket.save();

    // Notify the user if the admin replied
    if (req.user.role === "admin") {
      await sendTicketReplyEmail(
        ticket.user.email,
        ticket.user.stageName,
        ticket._id,
      );
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Failed to send reply" });
  }
};

// @desc Get single ticket by ID (The Thread)
export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate(
      "user",
      "stageName email",
    ); // Populate user info for admin context

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Security: Only the owner or an admin can see the ticket
    if (
      ticket.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Update ticket status to Resolved
export const resolveTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate(
      "user",
      "stageName",
    );

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // 1. Update Ticket Status
    ticket.status = "resolved";
    ticket.resolvedAt = new Date();
    await ticket.save();

    // 2. Create Immutable Audit Log
    await AuditLog.create({
      adminId: req.user._id, // From protect/admin middleware
      action: "TICKET_RESOLVE",
      targetType: "Ticket",
      targetId: ticket._id,
      details: `Resolved ticket #${ticket._id.toString().slice(-6)} for artist ${ticket.user?.stageName || "Unknown"}`,
      ipAddress: req.ip, // Optional: tracking IP for extra security
    });

    res.json({
      message: "Ticket marked as resolved and logged in audit trail",
      ticket,
    });
  } catch (error) {
    console.error("Resolve Error:", error);
    res.status(500).json({ message: "Failed to resolve ticket" });
  }
};
