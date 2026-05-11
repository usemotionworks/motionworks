import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

// Initialize Resend with your API Key (add this to your .env)
export const resend = new Resend(process.env.RESEND_API_KEY);

const companyLogo =
  "https://res.cloudinary.com/dvnolhdyk/image/upload/v1776817091/h0wou8gestqhgwfhsmag.png";

// 🎨 Helper for the premium dark template wrapper
const emailWrapper = (content) => `
  <div style="background-color: #050505; color: #B6B09F; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px 20px; text-align: center;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid rgba(182, 176, 159, 0.1); border-radius: 12px; padding: 40px; text-align: left;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${companyLogo}" alt="Motion Works" style="height: 40px; width: auto;" />
      </div>
      ${content}
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(182, 176, 159, 0.1); text-align: center; font-size: 12px; color: rgba(182, 176, 159, 0.5);">
        <p>© 2026 Motion Works. All Rights Reserved.</p>
        <p>This is an automated message, please do not reply directly to this email.</p>
      </div>
    </div>
  </div>
`;

// 📩 Send Verification Email
export const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const html = emailWrapper(`
    <h1 style="color: #EAE4D5; font-size: 24px; font-weight: bold; margin-bottom: 15px;">Welcome to the Roster, ${name}.</h1>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">Thank you for applying to join Motion Works. To complete your account setup and access the artist portal, please verify your email address.</p>

    <div style="text-align: center; margin: 35px 0;">
      <a href="${verificationUrl}" style="background-color: #EAE4D5; color: #0a0a0a; padding: 14px 30px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px;">Verify Email Address</a>
    </div>

    <p style="font-size: 14px; color: rgba(182, 176, 159, 0.7); line-height: 1.6;">If you did not create an account on our platform, you can safely ignore this email.</p>
  `);

  return await resend.emails.send({
    from: "Motion Works <info@usemotionworks.com>", // 👈 Requires a verified domain on Resend
    to: email,
    subject: "Verify your account | Motion Works",
    html,
  });
};

// 📩 Send Forgot Password Email
export const sendForgotPasswordEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = emailWrapper(`
    <h1 style="color: #EAE4D5; font-size: 24px; font-weight: bold; margin-bottom: 15px;">Reset Your Password</h1>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">We received a request to reset the password for your Motion Works account. Click the button below to proceed. This link will expire in 1 hour.</p>

    <div style="text-align: center; margin: 35px 0;">
      <a href="${resetUrl}" style="background-color: #EAE4D5; color: #0a0a0a; padding: 14px 30px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px;">Reset Password</a>
    </div>

    <p style="font-size: 14px; color: rgba(182, 176, 159, 0.7); line-height: 1.6;">If you did not request a password reset, please ignore this email or reach out to support if you have concerns.</p>
  `);

  return await resend.emails.send({
    from: "Motion Works <info@usemotionworks.com>",
    to: email,
    subject: "Password Reset Request | Motion Works",
    html,
  });
};

// 📩 Send Release Approval Email
export const sendReleaseApprovalEmail = async (email, name, releaseTitle) => {
  const html = emailWrapper(`
    <h1 style="color: #EAE4D5; font-size: 24px; font-weight: bold; margin-bottom: 15px;">Your Release is Approved.</h1>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">Excellent work, ${name}. Your release <strong>"${releaseTitle}"</strong> has been reviewed and approved for distribution.</p>

    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">Our team is now delivering your music to digital service platforms worldwide. You will receive further updates once your store links are ready.</p>

    <div style="text-align: center; margin: 35px 0;">
      <a href="${process.env.FRONTEND_URL}/dashboard/releases" style="background-color: #EAE4D5; color: #0a0a0a; padding: 14px 30px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px;">View in Dashboard</a>
    </div>
  `);

  return await resend.emails.send({
    from: "Motion Works <info@usemotionworks.com>",
    to: email,
    subject: `Approved: ${releaseTitle} | Motion Works`,
    html,
  });
};

// 📩 Send Release Rejection Email
export const sendReleaseRejectionEmail = async (
  email,
  name,
  releaseTitle,
  reason,
) => {
  const html = emailWrapper(`
    <h1 style="color: #EAE4D5; font-size: 24px; font-weight: bold; margin-bottom: 15px;">Action Required: ${releaseTitle}</h1>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">Hello ${name}, thank you for your submission. After reviewing <strong>"${releaseTitle}"</strong>, our moderation team found some issues that need to be addressed before we can proceed.</p>

    <div style="background-color: rgba(182, 176, 159, 0.05); border-left: 4px solid #EAE4D5; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 0; font-size: 14px; color: black; font-weight: bold;">Reason for rejection:</p>
      <p style="margin: 10px 0 0 0; font-size: 15px; color: #EAE4D5; line-height: 1.5;">${reason}</p>
    </div>

    <p style="font-size: 14px; line-height: 1.6; margin-bottom: 25px;">Please log in to your dashboard to edit your release and resubmit for review.</p>

    <div style="text-align: center; margin: 35px 0;">
      <a href="${process.env.FRONTEND_URL}/dashboard/releases" style="background-color: transparent; border: 1px solid #EAE4D5; color: #EAE4D5; padding: 14px 30px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px;">Edit Release</a>
    </div>
  `);

  return await resend.emails.send({
    from: "Motion Works <info@usemotionworks.com>",
    to: email,
    subject: `Update regarding your submission: ${releaseTitle}`,
    html,
  });
};

// 📩 Send Ticket Created Confirmation
export const sendTicketCreatedEmail = async (
  email,
  name,
  ticketId,
  subject,
) => {
  const html = emailWrapper(`
    <h1 style="color: #EAE4D5; font-size: 24px; font-weight: bold; margin-bottom: 15px;">Support Request Received</h1>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">Hello ${name}, we've opened a new support ticket for you regarding <strong>"${subject}"</strong>.</p>

    <div style="background-color: rgba(182, 176, 159, 0.05); padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <p style="margin: 0; font-size: 13px; color: #B6B09F;">Ticket ID: #${ticketId}</p>
      <p style="margin: 5px 0 0 0; font-size: 14px; color: #EAE4D5;">Status: OPEN</p>
    </div>

    <div style="text-align: center; margin: 35px 0;">
      <a href="${process.env.FRONTEND_URL}/dashboard/tickets" style="background-color: #EAE4D5; color: #0a0a0a; padding: 14px 30px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px;">View Ticket Thread</a>
    </div>
  `);

  return await resend.emails.send({
    from: "Motion Works Support <support@usemotionworks.com>",
    to: email,
    subject: `Support Ticket #${ticketId.toString().slice(-6)} Received`,
    html,
  });
};

// 📩 Send Admin Reply Notification
export const sendTicketReplyEmail = async (email, name, ticketId) => {
  const html = emailWrapper(`
    <h1 style="color: #EAE4D5; font-size: 24px; font-weight: bold; margin-bottom: 15px;">New Support Message</h1>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">Hi ${name}, an admin has replied to your support ticket #${ticketId.toString().slice(-6)}.</p>

    <div style="text-align: center; margin: 35px 0;">
      <a href="${process.env.FRONTEND_URL}/dashboard/tickets" style="background-color: #EAE4D5; color: #0a0a0a; padding: 14px 30px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px;">Read Reply</a>
    </div>
  `);

  return await resend.emails.send({
    from: "Motion Works Support <support@usemotionworks.com>",
    to: email,
    subject: `New reply to Ticket #${ticketId.toString().slice(-6)}`,
    html,
  });
};

// // 1. Create the AWS SES Transporter
// const transporter = nodemailer.createTransport({
//   host: "email-smtp.eu-north-1.amazonaws.com", // Check your AWS region
//   port: 587,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.AWS_SES_USER, // Your SMTP Username
//     pass: process.env.AWS_SES_PASS, // Your SMTP Password
//   },
// });

// // 📩 Updated sendVerificationEmail
// export const sendVerificationEmail = async (email, name, token) => {
//   const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

//   const html = emailWrapper(`...your same HTML content...`);

//   // 2. Change .send() to transporter.sendMail()
//   return await transporter.sendMail({
//     from: '"Motion Works" <info@usemotionworks.com>',
//     to: email,
//     subject: "Verify your account | Motion Works",
//     html,
//   });
// };
