import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { reportSchema } from '../common/validator/reportSchema.js';
import * as reportController from '../controllers/report.controller.js';

export const reportRoutes = Router();

// UC38 – SDS 9.2 ReportRoutes: người dùng (không phải Admin) báo cáo bài đăng / yêu cầu vi phạm
reportRoutes.post(
  '/',
  authentication,
  authorize('PARENT', 'TUTOR', 'STUDENT'),
  validator(reportSchema),
  reportController.createReport
);
