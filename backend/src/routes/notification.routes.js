import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';

export const notificationRoutes = Router();

// Lấy danh sách thông báo theo bộ lọc danh mục và trạng thái (UC35 / SC10)
notificationRoutes.get('/', notificationController.getNotifications);

// Đánh dấu tất cả thông báo là đã đọc
notificationRoutes.post('/mark-all-read', notificationController.markAllAsRead);

// Đánh dấu một thông báo là đã đọc
notificationRoutes.patch('/:notificationId/read', notificationController.markAsRead);

// Xóa một thông báo
notificationRoutes.delete('/:notificationId', notificationController.deleteNotification);
