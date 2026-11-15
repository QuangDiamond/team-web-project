import { Router } from 'express';
import { authentication, authorize, optionalAuthentication } from '../common/middlewares/auth.middleware.js';
import { AppError } from '../common/utils/AppError.js';
import { getTutorProfile, getParentProfile, listPosts, listTutors } from '../controllers/discovery.controller.js';

export const discoveryRoutes = Router();

// Public profiles are only for tutors and parents; students and admins do not use them
const PUBLIC_PROFILE_ROLES = ['TUTOR', 'PARENT'];

// Guests may still view a tutor profile (UC07); a logged-in student or admin gets 403
const blockNonProfileRoles = (req, res, next) => {
  if (req.user && !PUBLIC_PROFILE_ROLES.includes(req.user.role)) {
    return next(new AppError('Forbidden', 403));
  }
  return next();
};

// SC05 permits guests to search public tutor cards; invitations remain Parent-only.
discoveryRoutes.get('/tutors', listTutors);
// Public like /tutors: guests can browse PUBLISHED tutor posts on the /tutors page ("Bài đăng" tab).
discoveryRoutes.get('/posts', listPosts);

// UC07 permits guests to view a tutor's public profile.
discoveryRoutes.get('/tutors/:profileId', optionalAuthentication, blockNonProfileRoles, getTutorProfile);
discoveryRoutes.get('/parents/:userId', authentication, authorize(...PUBLIC_PROFILE_ROLES), getParentProfile);
