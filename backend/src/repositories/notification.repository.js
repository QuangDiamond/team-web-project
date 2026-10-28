import { Notification } from '../models/Notification.js';

export const findNotificationsByUser = async (userId, filter = {}) => {
  const query = {};
  if (userId) {
    query.recipient_user_id = userId;
  }
  if (filter.category && filter.category !== 'ALL') {
    query.category = filter.category;
  }
  if (filter.is_read !== undefined) {
    query.is_read = filter.is_read;
  }

  return await Notification.find(query).sort({ created_at: -1 });
};

export const markAsRead = async (notificationId) => {
  return await Notification.findByIdAndUpdate(
    notificationId,
    { is_read: true, read_at: new Date() },
    { new: true }
  );
};

export const markAllAsRead = async (userId) => {
  const query = userId ? { recipient_user_id: userId, is_read: false } : { is_read: false };
  return await Notification.updateMany(query, {
    is_read: true,
    read_at: new Date(),
  });
};

export const deleteNotification = async (notificationId) => {
  return await Notification.findByIdAndDelete(notificationId);
};

export const countUnread = async (userId) => {
  const query = { is_read: false };
  if (userId) query.recipient_user_id = userId;
  return await Notification.countDocuments(query);
};
