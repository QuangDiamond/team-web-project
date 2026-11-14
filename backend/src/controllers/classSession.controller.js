import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import { paginationQuerySchema } from '../common/validator/studentDashboardSchema.js';
import * as classSessionService from '../services/classSession.service.js';
import { ENUMS } from '../models/enums.js';

export const listClassSessions = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  let data;
  if (req.user.role === ENUMS.UserRole.STUDENT) {
    data = await classSessionService.listStudentClassSessions(req.user, req.params.classId, query);
  } else {
    data = await classSessionService.listClassSessions(req.user, req.params.classId, query);
  }
  return responseCommon(res, data, 'Class sessions retrieved successfully!', 200, responseCode.SUCCESSED);
});

export const getClassSession = asyncHandler(async (req, res) => {
  const data = await classSessionService.getClassSession(req.user, req.params.classId, req.params.sessionId);
  return responseCommon(res, data, 'Class session retrieved successfully!', 200, responseCode.SUCCESSED);
});

export const createClassSession = asyncHandler(async (req, res) => {
  const data = await classSessionService.createClassSession(req.user, req.params.classId, req.body);
  return responseCommon(res, data, 'Class session created successfully!', 201, responseCode.SUCCESSED);
});

export const updateClassSession = asyncHandler(async (req, res) => {
  const data = await classSessionService.updateClassSession(
    req.user,
    req.params.classId,
    req.params.sessionId,
    req.body,
  );
  return responseCommon(res, data, 'Class session updated successfully!', 200, responseCode.SUCCESSED);
});

export const deleteClassSession = asyncHandler(async (req, res) => {
  const data = await classSessionService.deleteClassSession(req.user, req.params.classId, req.params.sessionId);
  return responseCommon(res, data, 'Class session deleted successfully!', 200, responseCode.SUCCESSED);
});
