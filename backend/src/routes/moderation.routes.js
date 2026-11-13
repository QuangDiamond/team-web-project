import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { resolveReportSchema } from '../common/validator/moderationSchema.js';
import * as moderationController from '../controllers/moderation.controller.js';

export const moderationRoutes = Router();

// UC38 – Moderate Content & Reports (role ADMIN)
moderationRoutes.get('/', authentication, authorize('ADMIN'), moderationController.getReports);
moderationRoutes.get('/audit-logs', authentication, authorize('ADMIN'), moderationController.getAuditLogs);
moderationRoutes.get('/:reportId', authentication, authorize('ADMIN'), moderationController.getReportDetails);
moderationRoutes.post('/:reportId/resolve', authentication, authorize('ADMIN'), validator(resolveReportSchema), moderationController.resolveReport);
