import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
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

// TODO: authorize('TUTOR') cho tạo / xem / rút đơn, authorize('PARENT') cho continue / skip — middleware chưa có (AGENTS.md: Planned);
// tạm thời service kiểm tra role, quyền sở hữu và hồ sơ gia sư
applicationRoutes.post('/', authentication, validator(createApplicationSchema), createApplication);
applicationRoutes.get('/mine', authentication, listMyApplications);
// Không có body nên không cần validator
applicationRoutes.patch('/:id/withdraw', authentication, withdrawApplication);
// UC (phụ huynh duyệt đơn): Continue mở hội thoại 1-1, Skip bỏ qua. Không có body nên không cần validator
applicationRoutes.patch('/:id/continue', authentication, continueApplication);
applicationRoutes.patch('/:id/skip', authentication, skipApplication);
