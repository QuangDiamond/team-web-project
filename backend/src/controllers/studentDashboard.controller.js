import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import {
  activityQuerySchema,
  paginationQuerySchema,
  studentAssignmentsQuerySchema,
  studentScheduleQuerySchema,
  submissionHistoryQuerySchema,
} from '../common/validator/studentDashboardSchema.js';
import * as studentDashboardService from '../services/studentDashboard.service.js';

export const listJoinedClasses = asyncHandler(async (req, res) => {
  const data = await studentDashboardService.listJoinedClasses(req.user, parseQuery(paginationQuerySchema, req.query));
  return responseCommon(res, data, 'Get joined classes successfully!', 200, responseCode.SUCCESSED);
});

export const listUpcomingSessions = asyncHandler(async (req, res) => {
  const data = await studentDashboardService.listUpcomingSessions(req.user, parseQuery(paginationQuerySchema, req.query));
  return responseCommon(res, data, 'Get upcoming sessions successfully!', 200, responseCode.SUCCESSED);
});

export const listPendingAssignments = asyncHandler(async (req, res) => {
  const data = await studentDashboardService.listPendingAssignments(req.user, parseQuery(paginationQuerySchema, req.query));
  return responseCommon(res, data, 'Get pending assignments successfully!', 200, responseCode.SUCCESSED);
});

export const listPublishedGrades = asyncHandler(async (req, res) => {
  const data = await studentDashboardService.listPublishedGrades(req.user, parseQuery(paginationQuerySchema, req.query));
  return responseCommon(res, data, 'Get grades successfully!', 200, responseCode.SUCCESSED);
});

export const listAllAssignments = asyncHandler(async (req, res) => {
  const data = await studentDashboardService.listAllAssignments(
    req.user,
    parseQuery(studentAssignmentsQuerySchema, req.query)
  );
  return responseCommon(res, data, 'Get all assignments successfully!', 200, responseCode.SUCCESSED);
});

export const getLearningActivity = asyncHandler(async (req, res) => {
  const data = await studentDashboardService.getLearningActivity(
    req.user,
    parseQuery(activityQuerySchema, req.query)
  );
  return responseCommon(res, data, 'Get learning activity successfully!', 200, responseCode.SUCCESSED);
});

export const listSubmissionHistory = asyncHandler(async (req, res) => {
  const data = await studentDashboardService.listSubmissionHistory(
    req.user,
    parseQuery(submissionHistoryQuerySchema, req.query)
  );
  return responseCommon(res, data, 'Get submission history successfully!', 200, responseCode.SUCCESSED);
});

export const listStudentSchedule = asyncHandler(async (req, res) => {
  const query = parseQuery(studentScheduleQuerySchema, req.query);
  const data = await studentDashboardService.listStudentSchedule(req.user, query);
  return responseCommon(res, data, 'Get student schedule successfully!', 200, responseCode.SUCCESSED);
});
