import { AppError } from '../common/utils/AppError.js';
import * as notiRepo from '../repositories/notification.repository.js';

export const getNotifications = async (userId, filter = {}) => {
  const notifications = await notiRepo.findNotificationsByUser(userId, filter);
  const unreadCount = await notiRepo.countUnread(userId);

  return {
    unreadCount,
    notifications: notifications.map((n) => {
      let deepLink = '/notifications';
      if (n.category === 'APPLICATION') deepLink = '/applications';
      else if (n.category === 'INVITATION') deepLink = '/invitations';
      else if (n.category === 'CONVERSATION') deepLink = '/connections';
      else if (n.category === 'SESSION' || n.category === 'SCHEDULE_CHANGE') deepLink = '/calendar';
      else if (n.category === 'ASSIGNMENT') deepLink = '/classes';
      else if (n.category === 'SYSTEM') deepLink = '/payment';

      return {
        _id: n._id,
        category: n.category,
        title: n.title,
        body: n.body,
        target_type: n.target_type,
        target_id: n.target_id,
        is_read: n.is_read,
        read_at: n.read_at,
        created_at: n.created_at,
        delivery_logs: n.delivery_logs || [],
        deepLink,
      };
    }),
  };
};

export const markAsRead = async (notificationId) => {
  const updated = await notiRepo.markAsRead(notificationId);
  if (!updated) {
    throw new AppError('Không tìm thấy thông báo.', 404);
  }
  return updated;
};

export const markAllAsRead = async (userId) => {
  const result = await notiRepo.markAllAsRead(userId);
  return {
    success: true,
    modifiedCount: result.modifiedCount,
    message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
  };
};

export const deleteNotification = async (notificationId) => {
  const deleted = await notiRepo.deleteNotification(notificationId);
  if (!deleted) {
    throw new AppError('Không tìm thấy thông báo để xóa.', 404);
  }
  return {
    success: true,
    message: 'Đã xóa thông báo thành công.',
  };
};
