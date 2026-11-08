import mongoose from 'mongoose';
import { AppError } from '../common/utils/AppError.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';

const buildDeepLink = (notification, role) => {
  const normalizedRole = (role || 'PARENT').toUpperCase();
  const base = `/${normalizedRole.toLowerCase()}`;

  if (notification.category === 'APPLICATION') {
    return normalizedRole === 'TUTOR' ? '/tutor/applications' : '/parent/applications';
  }
  if (notification.category === 'INVITATION') {
    return normalizedRole === 'TUTOR' ? '/tutor/invitations' : '/parent/invitations';
  }
  if (notification.category === 'CONVERSATION') {
    if (normalizedRole === 'TUTOR') return '/tutor/contracts';
    if (normalizedRole === 'PARENT') return '/parent/contracts';
    return `${base}/dashboard`;
  }
  if (notification.category === 'SYSTEM' && normalizedRole === 'ADMIN') {
    return '/admin/moderation';
  }
  return `${base}/dashboard`;
};

/**
 * Lấy danh sách thông báo của người dùng hiện tại theo bộ lọc (UC33/UC35)
 * @param {Object} user - req.user { id, role }
 * @param {Object} filter - { category?, is_read? }
 * @returns {Promise<{ unreadCount: number, notifications: Object[] }>}
 */
export const getNotifications = async (user, filter = {}) => {
  const query = { recipient_user_id: user.id };
  if (filter.category && filter.category !== 'ALL') {
    query.category = filter.category;
  }
  if (filter.is_read !== undefined) {
    query.is_read = filter.is_read;
  }

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(query).sort({ created_at: -1 }).limit(50).lean(),
    Notification.countDocuments({ recipient_user_id: user.id, is_read: false }),
  ]);

  return {
    unreadCount,
    notifications: notifications.map((n) => ({
      _id: String(n._id),
      category: n.category,
      title: n.title,
      body: n.body,
      target_type: n.target_type,
      target_id: n.target_id ? String(n.target_id) : null,
      is_read: Boolean(n.is_read),
      read_at: n.read_at,
      created_at: n.created_at,
      delivery_logs: n.delivery_logs || [],
      deepLink: buildDeepLink(n, user.role),
    })),
  };
};

/**
 * Đếm số lượng thông báo chưa đọc của người dùng hiện tại
 * @param {Object} user - req.user { id, role }
 * @returns {Promise<{ unreadCount: number }>}
 */
export const getUnreadCount = async (user) => {
  const unreadCount = await Notification.countDocuments({
    recipient_user_id: user.id,
    is_read: false,
  });
  return { unreadCount };
};

/**
 * Đánh dấu một thông báo là đã đọc
 * @param {Object} user - req.user { id, role }
 * @param {string} notificationId
 * @returns {Promise<Object>}
 */
export const markAsRead = async (user, notificationId) => {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new AppError('Không tìm thấy thông báo.', 404);
  }
  const updated = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient_user_id: user.id },
    { $set: { is_read: true, read_at: new Date() } },
    { new: true }
  ).lean();

  if (!updated) {
    throw new AppError('Không tìm thấy thông báo.', 404);
  }
  return updated;
};

/**
 * Đánh dấu tất cả thông báo của người dùng là đã đọc
 * @param {Object} user - req.user { id, role }
 * @returns {Promise<Object>}
 */
export const markAllAsRead = async (user) => {
  const result = await Notification.updateMany(
    { recipient_user_id: user.id, is_read: false },
    { $set: { is_read: true, read_at: new Date() } }
  );
  return {
    success: true,
    modifiedCount: result.modifiedCount,
    message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
  };
};

/**
 * Xóa một thông báo của người dùng
 * @param {Object} user - req.user { id, role }
 * @param {string} notificationId
 * @returns {Promise<Object>}
 */
export const deleteNotification = async (user, notificationId) => {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new AppError('Không tìm thấy thông báo để xóa.', 404);
  }
  const deleted = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient_user_id: user.id,
  });
  if (!deleted) {
    throw new AppError('Không tìm thấy thông báo để xóa.', 404);
  }
  return {
    success: true,
    message: 'Đã xóa thông báo thành công.',
  };
};

/**
 * Lấy cấu hình nhận thông báo (UC33 Alternative Flow A1)
 * @param {Object} user - req.user { id, role }
 * @returns {Promise<Object>}
 */
export const getPreferences = async (user) => {
  const foundUser = await User.findById(user.id).select('notification_preferences').lean();
  if (!foundUser) {
    throw new AppError('Không tìm thấy người dùng.', 404);
  }
  const prefs = foundUser.notification_preferences || {};
  return {
    enable_in_app: prefs.enable_in_app ?? true,
    enable_email: prefs.enable_email ?? true,
    enable_sms: prefs.enable_sms ?? false,
    notify_on_sessions: prefs.notify_on_sessions ?? true,
    notify_on_assignments: prefs.notify_on_assignments ?? true,
    notify_on_messages: prefs.notify_on_messages ?? true,
  };
};

/**
 * Cập nhật cấu hình nhận thông báo (UC33 Alternative Flow A1 / SDS 7.3)
 * @param {Object} user - req.user { id, role }
 * @param {Object} payload - { enable_in_app?, enable_email?, enable_sms?, notify_on_sessions?, notify_on_assignments?, notify_on_messages? }
 * @returns {Promise<Object>}
 */
export const updatePreferences = async (user, payload) => {
  const current = await getPreferences(user);
  const nextPrefs = {
    enable_in_app: payload.enable_in_app ?? current.enable_in_app,
    enable_email: payload.enable_email ?? current.enable_email,
    enable_sms: payload.enable_sms ?? current.enable_sms,
    notify_on_sessions: payload.notify_on_sessions ?? current.notify_on_sessions,
    notify_on_assignments: payload.notify_on_assignments ?? current.notify_on_assignments,
    notify_on_messages: payload.notify_on_messages ?? current.notify_on_messages,
    updated_at: new Date(),
  };

  await User.updateOne(
    { _id: user.id },
    { $set: { notification_preferences: nextPrefs } }
  );

  return nextPrefs;
};
