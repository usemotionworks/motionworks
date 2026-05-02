import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const sendSubmissionSlackNotification = async (message) => {
  const webhookUrl = process.env.SLACK_SUBSMISSIONS_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("Slack Webhook URL is missing in .env");
    return;
  }

  try {
    // Slack expects a JSON object with a 'text' property
    await axios.post(webhookUrl, { text: message });
  } catch (error) {
    console.error("Failed to send Slack notification:", error.message);
  }
};

export const sendSupportSlackNotification = async (message) => {
  const webhookUrl = process.env.SLACK_REQUESTS_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("Slack Webhook URL is missing in .env");
    return;
  }

  try {
    // Slack expects a JSON object with a 'text' property
    await axios.post(webhookUrl, { text: message });
  } catch (error) {
    console.error("Failed to send Slack notification:", error.message);
  }
};

export const sendTicketsSlackNotification = async (message) => {
  const webhookUrl = process.env.SLACK_TICKETS_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("Slack Webhook URL is missing in .env");
    return;
  }

  try {
    // Slack expects a JSON object with a 'text' property
    await axios.post(webhookUrl, { text: message });
  } catch (error) {
    console.error("Failed to send Slack notification:", error.message);
  }
};

export const notifyAdmin = (message) => {
  // We don't use 'await' here in the main flow
  sendSubmissionSlackNotification(message).catch((err) => {
    // Log it to a file or error service like Sentry
    console.error("Silent Slack Failure:", err);
  });
};

export const notifyAdminNewTicket = (message) => {
  // We don't use 'await' here in the main flow
  sendTicketsSlackNotification(message).catch((err) => {
    // Log it to a file or error service like Sentry
    console.error("Silent Slack Failure:", err);
  });
};
