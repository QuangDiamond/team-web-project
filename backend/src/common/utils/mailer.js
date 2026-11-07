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

const STATUS_LABELS = {
  ACTIVE: 'reactivated',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
};

/**
 * Báo cho user biết tài khoản vừa bị khóa / mở lại (UC37)
 * @param {string} toEmail - email người nhận
 * @param {string} fullName - tên người nhận
 * @param {string} accountStatus - ACTIVE | SUSPENDED | BANNED
 * @param {string} reason - lý do Admin nhập
 * @returns {Promise<void>}
 */
export const sendAccountStatusEmail = async (toEmail, fullName, accountStatus, reason) => {
  const statusLabel = STATUS_LABELS[accountStatus] || accountStatus;
  await transporter.sendMail({
    from: env.smtpUser,
    to: toEmail,
    subject: `Your TuConnector account has been ${statusLabel}`,
    html: `
      <p>Hello ${escapeHtml(fullName)},</p>
      <p>Your account has been <b>${escapeHtml(statusLabel)}</b> by an administrator.</p>
      <p>Reason: ${escapeHtml(reason)}</p>
      <p>If you think this is a mistake, please reply to this email.</p>
    `,
  });
};

/**
 * Gửi mật khẩu tạm cho Admin mới (UC37 A1, D20)
 * @param {string} toEmail - email người nhận
 * @param {string} fullName - tên người nhận
 * @param {string} temporaryPassword - mật khẩu tạm
 * @param {string} loginLink - link trang đăng nhập
 * @returns {Promise<void>}
 */
export const sendAdminInviteEmail = async (toEmail, fullName, temporaryPassword, loginLink) => {
  await transporter.sendMail({
    from: env.smtpUser,
    to: toEmail,
    subject: 'Your TuConnector admin account',
    html: `
      <p>Hello ${escapeHtml(fullName)},</p>
      <p>An administrator account has been created for you.</p>
      <p>Email: ${escapeHtml(toEmail)}<br>Temporary password: <b>${escapeHtml(temporaryPassword)}</b></p>
      <p>Log in at <a href="${escapeHtml(loginLink)}">${escapeHtml(loginLink)}</a> and change your password as soon as possible.</p>
    `,
  });
};
