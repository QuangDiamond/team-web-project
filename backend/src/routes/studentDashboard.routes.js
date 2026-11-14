import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import {
  listJoinedClasses,
  listPendingAssignments,
  listPublishedGrades,
  listUpcomingSessions,
} from '../controllers/studentDashboard.controller.js';

// UC36 – View Student Dashboard
export const studentDashboardRoutes = Router();

studentDashboardRoutes.get('/classes', authentication, authorize('STUDENT'), listJoinedClasses);
studentDashboardRoutes.get('/sessions/upcoming', authentication, authorize('STUDENT'), listUpcomingSessions);
studentDashboardRoutes.get('/assignments/pending', authentication, authorize('STUDENT'), listPendingAssignments);
studentDashboardRoutes.get('/grades', authentication, authorize('STUDENT'), listPublishedGrades);
