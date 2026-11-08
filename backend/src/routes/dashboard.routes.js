import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { parentSummary, tutorSummary } from '../controllers/dashboard.controller.js';

// Số liệu tổng hợp cho Parent Dashboard và Tutor Dashboard
export const dashboardRoutes = Router();

dashboardRoutes.get('/parent/summary', authentication, authorize('PARENT'), parentSummary);
dashboardRoutes.get('/tutor/summary', authentication, authorize('TUTOR'), tutorSummary);
