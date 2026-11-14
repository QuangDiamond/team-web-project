import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { resolveReportSchema } from '../common/validator/moderationSchema.js';
import * as moderationController from '../controllers/moderation.controller.js';

export const moderationRoutes = Router();

// UC38 / UC40 – Moderate Content & Reports (role ADMIN)
// TODO: authorize('ADMIN') — middleware chưa có (AGENTS.md: Planned); service kiểm tra bằng assertRole
moderationRoutes.get('/', authentication, moderationController.getReports);
moderationRoutes.get('/audit-logs', authentication, moderationController.getAuditLogs);
moderationRoutes.get('/:reportId', authentication, moderationController.getReportDetails);
moderationRoutes.post('/:reportId/resolve', authentication, validator(resolveReportSchema), moderationController.resolveReport);
