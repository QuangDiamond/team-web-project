import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { updatePreferencesSchema } from '../common/validator/notificationSchema.js';
import * as notificationController from '../controllers/notification.controller.js';

export const notificationRoutes = Router();

// UC33 / UC35 – View Notifications (dùng chung cho mọi role đã đăng nhập)
notificationRoutes.get('/', authentication, notificationController.getNotifications);
notificationRoutes.get('/unread-count', authentication, notificationController.getUnreadCount);
notificationRoutes.get('/preferences', authentication, notificationController.getPreferences);
notificationRoutes.put('/preferences', authentication, validator(updatePreferencesSchema), notificationController.updatePreferences);
notificationRoutes.post('/mark-all-read', authentication, notificationController.markAllAsRead);
notificationRoutes.patch('/read-all', authentication, notificationController.markAllAsRead);
notificationRoutes.patch('/:notificationId/read', authentication, notificationController.markAsRead);
notificationRoutes.delete('/:notificationId', authentication, notificationController.deleteNotification);
