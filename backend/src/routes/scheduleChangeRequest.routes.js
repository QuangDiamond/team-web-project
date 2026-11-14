import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import {
  createScheduleChangeRequestSchema,
  respondScheduleChangeRequestSchema,
  updateScheduleChangeRequestSchema,
} from '../common/validator/scheduleChangeRequestSchema.js';
import {
  createScheduleChangeRequest,
  listScheduleChangeRequests,
  respondScheduleChangeRequest,
  updateScheduleChangeRequest,
  withdrawScheduleChangeRequest,
} from '../controllers/scheduleChangeRequest.controller.js';
import { ENUMS } from '../models/enums.js';

export const scheduleChangeRequestRoutes = Router();

scheduleChangeRequestRoutes.use(
  authentication,
  authorize(ENUMS.UserRole.TUTOR, ENUMS.UserRole.STUDENT),
);
scheduleChangeRequestRoutes.get('/', listScheduleChangeRequests);
scheduleChangeRequestRoutes.post('/', validator(createScheduleChangeRequestSchema), createScheduleChangeRequest);
scheduleChangeRequestRoutes.patch(
  '/:requestId/respond',
  validator(respondScheduleChangeRequestSchema),
  respondScheduleChangeRequest,
);
// Người tạo sửa / rút đề nghị của mình khi còn PENDING và chưa quá hạn
scheduleChangeRequestRoutes.patch(
  '/:requestId',
  validator(updateScheduleChangeRequestSchema),
  updateScheduleChangeRequest,
);
scheduleChangeRequestRoutes.patch('/:requestId/withdraw', withdrawScheduleChangeRequest);
