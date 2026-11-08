import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { AppError } from '../common/utils/AppError.js';
import { paginationQuerySchema } from '../common/validator/studentDashboardSchema.js';
import * as studentDashboardService from '../services/studentDashboard.service.js';

// validator() hiện chỉ đọc req.body nên query page/limit được validate tại đây
const parsePagination = (query) => {
  const result = paginationQuerySchema.safeParse(query);
  if (!result.success) {
    throw new AppError(result.error.issues[0].message, 422, result.error.flatten().fieldErrors);
  }
  return result.data;
};

export const listJoinedClasses = asyncHandler(async (req, res) => {
  const data = await studentDashboardService.listJoinedClasses(req.user, parsePagination(req.query));
  return responseCommon(res, data, 'Get joined classes successfully!', 200, responseCode.SUCCESSED);
});

export const listUpcomingSessions = asyncHandler(async (req, res) => {
  const data = await studentDashboardService.listUpcomingSessions(req.user, parsePagination(req.query));
  return responseCommon(res, data, 'Get upcoming sessions successfully!', 200, responseCode.SUCCESSED);
});

export const listPendingAssignments = asyncHandler(async (req, res) => {
  const data = await studentDashboardService.listPendingAssignments(req.user, parsePagination(req.query));
  return responseCommon(res, data, 'Get pending assignments successfully!', 200, responseCode.SUCCESSED);
});

export const listPublishedGrades = asyncHandler(async (req, res) => {
  const data = await studentDashboardService.listPublishedGrades(req.user, parsePagination(req.query));
  return responseCommon(res, data, 'Get grades successfully!', 200, responseCode.SUCCESSED);
});
