import nodemailer from 'nodemailer';
import { env } from '../../config/environment.js';

// Gửi mail qua Gmail SMTP, SMTP_PASS là App Password của Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

// Escape ký tự HTML để tên người dùng không chèn được HTML vào email
const escapeHtml = (text) => {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
};

/**
 * Gửi email chứa link kích hoạt tài khoản
 * @param {string} toEmail - email người nhận
 * @param {string} fullName - tên người nhận
 * @param {string} verifyLink - link kích hoạt
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async (toEmail, fullName, verifyLink) => {
  await transporter.sendMail({
    from: env.smtpUser,
    to: toEmail,
    subject: 'Verify your account',
    html: `
      <p>Hello ${escapeHtml(fullName)},</p>
      <p>Please click the link below to verify your account. The link expires in 24 hours.</p>
      <p><a href="${verifyLink}">${verifyLink}</a></p>
    `,
  });
};
