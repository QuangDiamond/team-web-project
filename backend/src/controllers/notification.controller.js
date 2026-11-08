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
  return responseCommon(res, result, 'Lấy danh sách thông báo thành công.', 200, 1);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user);
  return responseCommon(res, result, 'Lấy số thông báo chưa đọc thành công.', 200, 1);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const result = await notificationService.markAsRead(req.user, notificationId);
  return responseCommon(res, result, 'Đã đánh dấu thông báo là đã đọc.', 200, 1);
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user);
  return responseCommon(res, result, result.message, 200, 1);
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const result = await notificationService.deleteNotification(req.user, notificationId);
  return responseCommon(res, result, result.message, 200, 1);
});

export const getPreferences = asyncHandler(async (req, res) => {
  const result = await notificationService.getPreferences(req.user);
  return responseCommon(res, result, 'Lấy cấu hình nhận thông báo thành công.', 200, 1);
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const result = await notificationService.updatePreferences(req.user, req.body);
  return responseCommon(res, result, 'Cập nhật cấu hình nhận thông báo thành công.', 200, 1);
});
