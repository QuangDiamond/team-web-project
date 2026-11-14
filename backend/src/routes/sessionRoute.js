import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { getUserSessions } from '../controllers/sessionController.js';
import { ENUMS } from '../models/enums.js';

export const sessionRoute = Router();

sessionRoute.get(
  '/',
  authentication,
  authorize(ENUMS.UserRole.TUTOR, ENUMS.UserRole.STUDENT, ENUMS.UserRole.PARENT),
  getUserSessions,
);
