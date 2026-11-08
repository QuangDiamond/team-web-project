import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import { assertRole } from '../common/utils/assertRole.js';
import { ENUMS } from '../models/enums.js';
import { getMyClassrooms } from '../controllers/classroom.controller.js';

export const classroomRoutes = Router();

const tutorOnly = (req, res, next) => {
  assertRole(req.user, ENUMS.UserRole.TUTOR);
  return next();
};

classroomRoutes.get('/me', authentication, tutorOnly, getMyClassrooms);
