import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import {
  listJoinedClasses,
  listPendingAssignments,
  listPublishedGrades,
  listUpcomingSessions,
} from '../controllers/studentDashboard.controller.js';

// UC36 – View Student Dashboard
export const studentDashboardRoutes = Router();

// TODO: authorize('STUDENT') — middleware chưa có (AGENTS.md: Planned); tạm thời service tự kiểm tra role
studentDashboardRoutes.get('/classes', authentication, listJoinedClasses);
studentDashboardRoutes.get('/sessions/upcoming', authentication, listUpcomingSessions);
studentDashboardRoutes.get('/assignments/pending', authentication, listPendingAssignments);
studentDashboardRoutes.get('/grades', authentication, listPublishedGrades);
