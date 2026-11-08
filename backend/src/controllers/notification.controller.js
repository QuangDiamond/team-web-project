import { asyncHandler } from '../common/utils/asyncHandler.js';
import { responseCommon } from '../common/response.js';
import * as notificationService from '../services/notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { category, is_read } = req.query;
  const filter = {
    category,
    is_read: is_read !== undefined ? is_read === 'true' : undefined,
  };

  const result = await notificationService.getNotifications(req.user, filter);
  return responseCommon(res, 200, {
    success: 1,
    message: 'Lấy danh sách thông báo thành công.',
    data: result,
  });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user);
  return responseCommon(res, 200, {
    success: 1,
    message: 'Lấy số thông báo chưa đọc thành công.',
    data: result,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const result = await notificationService.markAsRead(req.user, notificationId);
  return responseCommon(res, 200, {
    success: 1,
    message: 'Đã đánh dấu thông báo là đã đọc.',
    data: result,
  });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user);
  return responseCommon(res, 200, {
    success: 1,
    message: result.message,
    data: result,
  });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const result = await notificationService.deleteNotification(req.user, notificationId);
  return responseCommon(res, 200, {
    success: 1,
    message: result.message,
    data: result,
  });
});

export const getPreferences = asyncHandler(async (req, res) => {
  const result = await notificationService.getPreferences(req.user);
  return responseCommon(res, 200, {
    success: 1,
    message: 'Lấy cấu hình nhận thông báo thành công.',
    data: result,
  });
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const result = await notificationService.updatePreferences(req.user, req.body);
  return responseCommon(res, 200, {
    success: 1,
    message: 'Cập nhật cấu hình nhận thông báo thành công.',
    data: result,
  });
});
