import { Router } from 'express';
import * as moderationController from '../controllers/moderation.controller.js';

export const moderationRoutes = Router();

// Lấy danh sách báo cáo vi phạm và bộ lọc (UC40 / SC43)
moderationRoutes.get('/', moderationController.getReports);

// Lấy danh sách audit logs (BR-20)
moderationRoutes.get('/audit-logs', moderationController.getAuditLogs);

// Lấy chi tiết một báo cáo
moderationRoutes.get('/:reportId', moderationController.getReportDetails);

// Xử lý báo cáo vi phạm (Approve / Hide / Remove / Warn / Ban) kèm lý do BR-20
moderationRoutes.post('/:reportId/resolve', moderationController.resolveReport);
