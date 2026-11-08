import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { getTutorProfile, getParentProfile } from '../controllers/discovery.controller.js';

export const discoveryRoutes = Router();

// UC07 permits guests to view a tutor's public profile.
discoveryRoutes.get('/tutors/:profileId', getTutorProfile);
discoveryRoutes.get('/parents/:userId', authentication, authorize('TUTOR', 'PARENT', 'ADMIN'), getParentProfile);
