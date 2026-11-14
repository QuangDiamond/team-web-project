import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import { paginationQuerySchema } from '../common/validator/studentDashboardSchema.js';
import * as sessionAttendanceService from '../services/sessionAttendance.service.js';

export const getSessionAttendance = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  const data = await sessionAttendanceService.getSessionAttendance(
    req.user,
    req.params.classId,
    req.params.sessionId,
    query,
  );
  return responseCommon(res, data, 'Attendance retrieved successfully', 200, responseCode.SUCCESSED);
});

export const createSessionAttendance = asyncHandler(async (req, res) => {
  const data = await sessionAttendanceService.createSessionAttendance(
    req.user,
    req.params.classId,
    req.params.sessionId,
    req.body,
  );
  return responseCommon(res, data, 'Attendance recorded successfully', 201, responseCode.SUCCESSED);
});

export const updateSessionAttendance = asyncHandler(async (req, res) => {
  const data = await sessionAttendanceService.updateSessionAttendance(
    req.user,
    req.params.classId,
    req.params.sessionId,
    req.body,
  );
  return responseCommon(res, data, 'Attendance updated successfully', 200, responseCode.SUCCESSED);
});
