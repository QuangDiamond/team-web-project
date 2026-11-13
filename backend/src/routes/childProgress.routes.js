import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import {
  getChildResultDetail,
  getChildScoreTrend,
  getChildSummary,
  listChildAttendance,
  listChildClasses,
  listChildResults,
  listChildUpcomingSessions,
} from '../controllers/childProgress.controller.js';

// UC35 – Monitor Child Progress (Parent). Danh sách con đã liên kết lấy từ GET /api/parent-requests/v1/children
export const childProgressRoutes = Router();

childProgressRoutes.get('/:childId/summary', authentication, authorize('PARENT'), getChildSummary);
childProgressRoutes.get('/:childId/classes', authentication, authorize('PARENT'), listChildClasses);
childProgressRoutes.get('/:childId/sessions/upcoming', authentication, authorize('PARENT'), listChildUpcomingSessions);
childProgressRoutes.get('/:childId/attendance', authentication, authorize('PARENT'), listChildAttendance);
childProgressRoutes.get('/:childId/results', authentication, authorize('PARENT'), listChildResults);
// Route cố định phải khai báo trước /results/:submissionId
childProgressRoutes.get('/:childId/results/trend', authentication, authorize('PARENT'), getChildScoreTrend);
childProgressRoutes.get('/:childId/results/:submissionId', authentication, authorize('PARENT'), getChildResultDetail);
