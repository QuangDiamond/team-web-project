// UC37 Manage User Accounts (Admin)
import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Plan } from '../models/Plan.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { AppError } from '../common/utils/AppError.js';
import { sendAccountStatusEmail, sendAdminInviteEmail } from '../common/utils/mailer.js';
import { env } from '../config/environment.js';
import { createUser } from './user.service.js';
import { buildDateRange } from './transaction.service.js';
import { FREE_PLAN_NAME } from './plan.service.js';
import { escapeRegex } from '../common/utils/requestRules.js';

const LIST_FIELDS = 'full_name email role account_status email_verify_status created_at last_login_at';
const AUDIT_LOG_LIMIT = 20;

/**
 * Đổi User document sang dạng trả về của danh sách
 * @param {Object} user - User document
 * @returns {Object} { _id, full_name, email, role, account_status, email_verify_status, created_at, last_login_at }
 */
const toUserListItem = (user) => {
  return {
    _id: user._id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    account_status: user.account_status,
    email_verify_status: user.email_verify_status,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
  };
};

/**
 * Tìm user theo id, báo 404 nếu id sai định dạng hoặc không tồn tại
 * @param {string} userId - id của User
 * @returns {Promise<Object>} User document
 */
const findUserOrThrow = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError('User not found', 404);
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

/**
 * Sinh mật khẩu tạm ngẫu nhiên 12 ký tự, đủ BR-01 (có chữ hoa, chữ thường, chữ số)
 * @returns {string} mật khẩu tạm
 */
const generateTemporaryPassword = () => {
  // Bỏ các ký tự dễ nhầm (I, l, O, 0, 1)
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const all = upper + lower + digits;

  const characters = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
  ];
  while (characters.length < 12) {
    characters.push(all[crypto.randomInt(all.length)]);
  }
  // Trộn để 3 ký tự bắt buộc không luôn nằm đầu
  for (let index = characters.length - 1; index > 0; index--) {
    const swapIndex = crypto.randomInt(index + 1);
    const temp = characters[index];
    characters[index] = characters[swapIndex];
    characters[swapIndex] = temp;
  }
  return characters.join('');
};

/**
 * Danh sách user cho Admin, mới nhất trước (UC37 bước 1)
 * @param {Object} filters - { q, role, status, from, to } (đã validate)
 * @param {number} skip - số dòng bỏ qua
 * @param {number} limit - số dòng tối đa
 * @returns {Promise<{ items: Object[], total: number }>}
 */
export const listUsers = async (filters, skip, limit) => {
  const query = {};
  if (filters.q) {
    const searchRegex = new RegExp(escapeRegex(filters.q), 'i');
    query.$or = [{ full_name: searchRegex }, { email: searchRegex }];
  }
  if (filters.role) {
    query.role = filters.role;
  }
  if (filters.status) {
    query.account_status = filters.status;
  }
  const dateRange = buildDateRange(filters);
  if (dateRange) {
    query.created_at = dateRange;
  }

  const users = await User.find(query).select(LIST_FIELDS).sort({ created_at: -1, _id: -1 }).skip(skip).limit(limit);
  const total = await User.countDocuments(query);
  return { items: users.map(toUserListItem), total };
};

/**
 * Chi tiết user cho Admin (UC37 bước 2) kèm 20 audit log gần nhất tác động lên user này
 * @param {string} userId - id của User
 * @returns {Promise<{ user: Object, audit_logs: Object[] }>}
 */
export const getUserDetail = async (userId) => {
  const user = await findUserOrThrow(userId);

  let creditBalance = null;
  if (user.credit_wallet) {
    creditBalance = user.credit_wallet.balance;
  }

  // Gói đang dùng: subscription còn hạn, không thì gói Free của role (chỉ TUTOR / PARENT có gói)
  let planName = null;
  const subscription = user.subscription;
  if (subscription && subscription.status === 'ACTIVE' && subscription.expires_at > new Date()) {
    const plan = await Plan.findById(subscription.plan_id).select('name');
    if (plan) {
      planName = plan.name;
    }
  }
  if (!planName && (user.role === 'TUTOR' || user.role === 'PARENT')) {
    planName = FREE_PLAN_NAME;
  }

  const logs = await AdminAuditLog.find({ target_user_id: user._id })
    .sort({ created_at: -1, _id: -1 })
    .limit(AUDIT_LOG_LIMIT)
    .populate('admin_user_id', 'full_name');

  const auditLogs = logs.map((log) => {
    let admin = null;
    if (log.admin_user_id) {
      admin = { _id: log.admin_user_id._id, full_name: log.admin_user_id.full_name };
    }
    return { action: log.action, reason: log.reason, admin: admin, created_at: log.created_at };
  });

  const userDetail = toUserListItem(user);
  userDetail.avatar_url = user.avatar_url;
  userDetail.has_password = user.has_password;
  userDetail.google_linked = Boolean(user.google_account);
  userDetail.credit_balance = creditBalance;
  userDetail.plan_name = planName;

  return { user: userDetail, audit_logs: auditLogs };
};

/**
 * Admin đổi trạng thái tài khoản (UC37 bước 3–4). Không được đổi tài khoản của chính mình (E1, D21).
 * Ghi audit LOCK_USER / UNLOCK_USER (BR-16) và gửi email báo user (lỗi gửi mail chỉ ghi log)
 * @param {string} userId - id user bị tác động
 * @param {Object} data - { account_status, reason }
 * @param {Object} admin - { adminUserId, ipAddress }
 * @returns {Promise<Object>} user sau khi đổi (dạng danh sách)
 */
export const updateUserStatus = async (userId, data, admin) => {
  const user = await findUserOrThrow(userId);
  // So sánh sau khi load để bắt mọi dạng id (vd chữ hoa) của chính Admin đang thao tác
  if (String(user._id) === String(admin.adminUserId)) {
    throw new AppError('You cannot change your own account status', 403);
  }
  if (user.account_status === data.account_status) {
    throw new AppError(`The account is already ${data.account_status}`, 422, {
      account_status: [`The account is already ${data.account_status}`],
    });
  }

  // D24: luôn giữ ít nhất 1 Admin ACTIVE
  if (user.role === 'ADMIN' && user.account_status === 'ACTIVE' && data.account_status !== 'ACTIVE') {
    const otherActiveAdmins = await User.countDocuments({ role: 'ADMIN', account_status: 'ACTIVE', _id: { $ne: user._id } });
    if (otherActiveAdmins === 0) {
      throw new AppError('At least one active admin is required', 422, {
        account_status: ['At least one active admin is required'],
      });
    }
  }

  const before = { account_status: user.account_status };
  user.account_status = data.account_status;
  await user.save();

  let action = 'LOCK_USER';
  if (data.account_status === 'ACTIVE') {
    action = 'UNLOCK_USER';
  }
  await AdminAuditLog.create({
    admin_user_id: admin.adminUserId,
    target_user_id: user._id,
    action: action,
    reason: data.reason,
    details_json: { before: before, after: { account_status: user.account_status } },
    ip_address: admin.ipAddress,
  });

  try {
    await sendAccountStatusEmail(user.email, user.full_name, user.account_status, data.reason);
  } catch (error) {
    console.error(`Send account status email to ${user.email} failed:`, error.message);
  }

  return toUserListItem(user);
};

/**
 * Admin tạo tài khoản Admin khác với mật khẩu tạm (UC37 A1, D20). Mật khẩu tạm chỉ trả về 1 lần và gửi qua email.
 * Ghi audit UPDATE_SETTINGS (operation CREATE_ADMIN)
 * @param {Object} data - { full_name, email, reason }
 * @param {Object} admin - { adminUserId, ipAddress }
 * @returns {Promise<{ user: Object, temporary_password: string }>}
 */
export const createAdmin = async (data, admin) => {
  // Email Admin mới lưu chữ thường; kiểm tra trùng không phân biệt hoa thường
  const email = data.email.trim().toLowerCase();
  const existedUser = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') });
  if (existedUser) {
    throw new AppError('This email is already registered', 409);
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  const createdUser = await createUser({
    full_name: data.full_name,
    email: email,
    password_hash: passwordHash,
    role: 'ADMIN',
  });
  // Admin do Admin tạo không cần bấm link kích hoạt email
  const newAdmin = await User.findByIdAndUpdate(
    createdUser._id,
    { email_verify_status: true, is_onboarded: true },
    { new: true }
  );

  await AdminAuditLog.create({
    admin_user_id: admin.adminUserId,
    target_user_id: newAdmin._id,
    action: 'UPDATE_SETTINGS',
    reason: data.reason,
    details_json: { operation: 'CREATE_ADMIN', target_email: newAdmin.email },
    ip_address: admin.ipAddress,
  });

  try {
    await sendAdminInviteEmail(newAdmin.email, newAdmin.full_name, temporaryPassword, `${env.corsOrigin}/login`);
  } catch (error) {
    console.error(`Send admin invite email to ${newAdmin.email} failed:`, error.message);
  }

  return { user: toUserListItem(newAdmin), temporary_password: temporaryPassword };
};
