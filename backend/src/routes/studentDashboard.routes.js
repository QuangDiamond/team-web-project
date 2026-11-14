import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import {
  getLearningActivity,
  listAllAssignments,
  listJoinedClasses,
  listPendingAssignments,
  listPublishedGrades,
  listStudentSchedule,
  listSubmissionHistory,
  listUpcomingSessions,
} from '../controllers/studentDashboard.controller.js';

// UC36 – View Student Dashboard
export const studentDashboardRoutes = Router();

studentDashboardRoutes.get('/classes', authentication, authorize('STUDENT'), listJoinedClasses);
studentDashboardRoutes.get('/sessions/upcoming', authentication, authorize('STUDENT'), listUpcomingSessions);
studentDashboardRoutes.get('/schedule', authentication, authorize('STUDENT'), listStudentSchedule);
studentDashboardRoutes.get('/assignments', authentication, authorize('STUDENT'), listAllAssignments);
studentDashboardRoutes.get('/assignments/pending', authentication, authorize('STUDENT'), listPendingAssignments);
studentDashboardRoutes.get('/grades', authentication, authorize('STUDENT'), listPublishedGrades);
studentDashboardRoutes.get('/activity', authentication, authorize('STUDENT'), getLearningActivity);
studentDashboardRoutes.get('/submissions/history', authentication, authorize('STUDENT'), listSubmissionHistory);
