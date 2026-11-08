import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { createApplicationSchema } from '../common/validator/applicationSchema.js';
import {
  continueApplication,
  createApplication,
  listMyApplications,
  skipApplication,
  withdrawApplication,
} from '../controllers/application.controller.js';

// UC12 – Apply to Request (Tutor)
export const applicationRoutes = Router();

applicationRoutes.post('/', authentication, authorize('TUTOR'), validator(createApplicationSchema), createApplication);
applicationRoutes.get('/mine', authentication, authorize('TUTOR'), listMyApplications);
// Không có body nên không cần validator
applicationRoutes.patch('/:id/withdraw', authentication, authorize('TUTOR'), withdrawApplication);
// UC (phụ huynh duyệt đơn): Continue mở hội thoại 1-1, Skip bỏ qua. Không có body nên không cần validator
applicationRoutes.patch('/:id/continue', authentication, authorize('PARENT'), continueApplication);
applicationRoutes.patch('/:id/skip', authentication, authorize('PARENT'), skipApplication);
