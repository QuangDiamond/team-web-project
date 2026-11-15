import nodemailer from 'nodemailer';
import { env } from '../../config/environment.js';
import { escapeHtml } from './html.js';

// Gửi mail qua Gmail SMTP, SMTP_PASS là App Password của Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

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

export const sendPasswordResetEmail = async (toEmail, fullName, resetLink) => {
  await transporter.sendMail({
    from: env.smtpUser, to: toEmail, subject: 'Reset your TuConnector password',
    html: `<p>Hello ${escapeHtml(fullName)},</p>
      <p>This single-use reset link expires in 15 minutes. If you did not request it, ignore this email.</p>
      <p><a href="${escapeHtml(resetLink)}">Reset password</a></p>`,
  });
};

export const sendPasswordChangedEmail = async (toEmail, fullName) => {
  await transporter.sendMail({
    from: env.smtpUser, to: toEmail, subject: 'Your TuConnector password was changed',
    html: `<p>Hello ${escapeHtml(fullName)},</p>
      <p>Your password was changed. Other sessions have been signed out.</p>
      <p>If this was not you, reset your password immediately and contact support.</p>`,
  });
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

const formatBillDate = (value) => {
  return new Date(value).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
};

const formatBillAmount = (value) => {
  return `${Number(value).toLocaleString('vi-VN')} VND`;
};

/**
 * Gửi bill khi thanh toán thành công (UC17): thông tin đơn, gói / credit pack và thời gian hiệu lực của gói
 * @param {string} toEmail - email người mua
 * @param {string} fullName - tên người mua
 * @param {Object} bill - { order_code, paid_at, amount, payment_method, receipt_url, plan, period, pack }
 *   plan: { name, billing_period, monthly_credits, ai_quota, max_classrooms } | null
 *   period: { start_date, expires_at, is_scheduled } | null
 *   pack: { name, quantity, credit_amount } | null
 * @returns {Promise<void>}
 */
export const sendPaymentReceiptEmail = async (toEmail, fullName, bill) => {
  const rows = [
    ['Order code', bill.order_code],
    ['Paid at', new Date(bill.paid_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })],
    ['Payment method', bill.payment_method || '-'],
  ];

  if (bill.plan) {
    let classLimit = 'Unlimited';
    if (bill.plan.max_classrooms !== null && bill.plan.max_classrooms !== undefined) {
      classLimit = String(bill.plan.max_classrooms);
    }
    rows.push(['Plan', bill.plan.name]);
    rows.push(['Billing period', bill.plan.billing_period]);
    rows.push(['Credits per month', String(bill.plan.monthly_credits ?? 0)]);
    rows.push(['AI quota per month', String(bill.plan.ai_quota ?? 0)]);
    rows.push(['Classroom limit', classLimit]);
  }
  if (bill.period) {
    rows.push(['Start date', formatBillDate(bill.period.start_date)]);
    rows.push(['End date', formatBillDate(bill.period.expires_at)]);
  }
  if (bill.pack) {
    rows.push(['Credit pack', bill.pack.name]);
    rows.push(['Quantity', String(bill.pack.quantity)]);
    rows.push(['Total credits', String(bill.pack.credit_amount * bill.pack.quantity)]);
  }
  rows.push(['Total paid', formatBillAmount(bill.amount)]);

  const tableRows = rows
    .map(([label, value]) => `<tr><td style="padding:4px 12px 4px 0;color:#555">${escapeHtml(label)}</td><td style="padding:4px 0"><b>${escapeHtml(value)}</b></td></tr>`)
    .join('');

  let scheduleNote = '';
  if (bill.period && bill.period.is_scheduled) {
    scheduleNote = '<p>Your current plan stays active until it ends. The new plan, its credits and AI quota start on the start date above.</p>';
  }

  await transporter.sendMail({
    from: env.smtpUser,
    to: toEmail,
    subject: `TuConnector payment receipt ${bill.order_code}`,
    html: `
      <p>Hello ${escapeHtml(fullName)},</p>
      <p>Thank you for your payment. Here is your bill.</p>
      <table>${tableRows}</table>
      ${scheduleNote}
      <p>View or print the receipt: <a href="${escapeHtml(bill.receipt_url)}">${escapeHtml(bill.receipt_url)}</a></p>
    `,
  });
};
