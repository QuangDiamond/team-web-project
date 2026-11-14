import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import { assertRole } from '../common/utils/assertRole.js';
import { validator } from '../common/validator/validator.js';
import { saveSessionAttendanceSchema } from '../common/validator/sessionAttendanceSchema.js';
import { ENUMS } from '../models/enums.js';
import {
  createSessionAttendance,
  getSessionAttendance,
  updateSessionAttendance,
} from '../controllers/sessionAttendance.controller.js';

export const sessionAttendanceRoutes = Router();

const tutorOnly = (req, res, next) => {
  assertRole(req.user, ENUMS.UserRole.TUTOR);
  return next();
};

sessionAttendanceRoutes.get(
  '/:classId/sessions/:sessionId/attendance',
  authentication,
  tutorOnly,
  getSessionAttendance,
);
sessionAttendanceRoutes.post(
  '/:classId/sessions/:sessionId/attendance',
  authentication,
  tutorOnly,
  validator(saveSessionAttendanceSchema),
  createSessionAttendance,
);
sessionAttendanceRoutes.put(
  '/:classId/sessions/:sessionId/attendance',
  authentication,
  tutorOnly,
  validator(saveSessionAttendanceSchema),
  updateSessionAttendance,
);
