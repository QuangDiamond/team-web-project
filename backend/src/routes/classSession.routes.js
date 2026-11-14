import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { assertRole } from '../common/utils/assertRole.js';
import { validator } from '../common/validator/validator.js';
import { createClassSessionSchema, updateClassSessionSchema } from '../common/validator/classSessionSchema.js';
import { ENUMS } from '../models/enums.js';
import {
  createClassSession,
  deleteClassSession,
  getClassSession,
  listClassSessions,
  updateClassSession,
} from '../controllers/classSession.controller.js';

export const classSessionRoutes = Router();

const tutorOnly = (req, res, next) => {
  assertRole(req.user, ENUMS.UserRole.TUTOR);
  return next();
};

classSessionRoutes.get('/:classId/sessions', authentication, authorize('TUTOR', 'STUDENT'), listClassSessions);
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
