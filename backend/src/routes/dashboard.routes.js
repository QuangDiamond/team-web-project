import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import { parentSummary, tutorSummary } from '../controllers/dashboard.controller.js';

// Số liệu tổng hợp cho Parent Dashboard và Tutor Dashboard
export const dashboardRoutes = Router();

// TODO: authorize('PARENT') / authorize('TUTOR') — middleware chưa có (AGENTS.md: Planned); tạm thời service kiểm tra role
dashboardRoutes.get('/parent/summary', authentication, parentSummary);
dashboardRoutes.get('/tutor/summary', authentication, tutorSummary);
