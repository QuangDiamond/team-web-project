import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { tutorProfileBodySchema } from '../common/validator/tutorProfileSchema.js';
import { getMyProfile, saveMyProfile } from '../controllers/tutorProfile.controller.js';

// Hồ sơ gia sư của chính mình
export const tutorProfileRoutes = Router();

// TODO: authorize('TUTOR') — middleware chưa có (AGENTS.md: Planned); tạm thời service kiểm tra role
tutorProfileRoutes.get('/me', authentication, getMyProfile);
tutorProfileRoutes.put('/me', authentication, validator(tutorProfileBodySchema), saveMyProfile);
