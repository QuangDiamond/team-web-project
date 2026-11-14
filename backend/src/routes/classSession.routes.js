import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { assertRole } from '../common/utils/assertRole.js';
import { validator } from '../common/validator/validator.js';
import {
  createClassSessionSchema,
  createScheduleChangeRequestSchema,
  markAttendanceSchema,
  respondScheduleChangeRequestSchema,
  updateClassSessionSchema,
} from '../common/validator/classSessionSchema.js';
import { ENUMS } from '../models/enums.js';
import {
  createClassSession,
  createScheduleChangeRequest,
  deleteClassSession,
  getClassSession,
  listClassSessions,
  listScheduleChangeRequests,
  markAttendance,
  respondScheduleChangeRequest,
  updateClassSession,
} from '../controllers/classSession.controller.js';

export const classSessionRoutes = Router();

const tutorOnly = (req, res, next) => {
  assertRole(req.user, ENUMS.UserRole.TUTOR);
  return next();
};

// 1. Quản lý buổi học (UC26 & UC30)
classSessionRoutes.get('/:classId/sessions', authentication, authorize('TUTOR', 'STUDENT', 'PARENT'), listClassSessions);
classSessionRoutes.get('/:classId/sessions/:sessionId', authentication, tutorOnly, getClassSession);
classSessionRoutes.post(
  '/:classId/sessions',
  authentication,
  tutorOnly,
  validator(createClassSessionSchema),
  createClassSession,
);
classSessionRoutes.patch(
  '/:classId/sessions/:sessionId',
  authentication,
  tutorOnly,
  validator(updateClassSessionSchema),
  updateClassSession,
);
classSessionRoutes.delete('/:classId/sessions/:sessionId', authentication, tutorOnly, deleteClassSession);

// 2. Điểm danh buổi học (UC26.A2)
classSessionRoutes.post(
  '/:classId/sessions/:sessionId/attendance',
  authentication,
  tutorOnly,
  validator(markAttendanceSchema),
  markAttendance,
);

// 3. Yêu cầu đổi / hủy lịch học (UC27 & UC28)
classSessionRoutes.get('/:classId/change-requests', authentication, listScheduleChangeRequests);
classSessionRoutes.post(
  '/:classId/sessions/:sessionId/change-requests',
  authentication,
  validator(createScheduleChangeRequestSchema),
  createScheduleChangeRequest,
);
classSessionRoutes.patch(
  '/:classId/change-requests/:requestId',
  authentication,
  tutorOnly,
  validator(respondScheduleChangeRequestSchema),
  respondScheduleChangeRequest,
);
