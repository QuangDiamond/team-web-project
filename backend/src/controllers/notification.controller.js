import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import * as notificationService from '../services/notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user?.id, {
    category: req.query.category,
    is_read: req.query.is_read !== undefined ? req.query.is_read === 'true' : undefined,
  });
  return responseCommon(
    res,
    result,
    'Lấy danh sách thông báo thành công!',
    200,
    responseCode.SUCCESSED
  );
});

export const markAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAsRead(req.params.notificationId);
  return responseCommon(
    res,
    result,
    'Đã đánh dấu thông báo là đã đọc.',
    200,
    responseCode.SUCCESSED
  );
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user?.id);
  return responseCommon(
    res,
    result,
    result.message,
    200,
    responseCode.SUCCESSED
  );
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteNotification(req.params.notificationId);
  return responseCommon(
    res,
    result,
    result.message,
    200,
    responseCode.SUCCESSED
  );
});
