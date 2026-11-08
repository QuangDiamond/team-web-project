import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { tutorProfileBodySchema } from '../common/validator/tutorProfileSchema.js';
import { getMyProfile, saveMyProfile } from '../controllers/tutorProfile.controller.js';

// Hồ sơ gia sư của chính mình
export const tutorProfileRoutes = Router();

tutorProfileRoutes.get('/me', authentication, authorize('TUTOR'), getMyProfile);
tutorProfileRoutes.put('/me', authentication, authorize('TUTOR'), validator(tutorProfileBodySchema), saveMyProfile);
