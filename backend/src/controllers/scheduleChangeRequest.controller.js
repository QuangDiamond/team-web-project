import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import { paginationQuerySchema } from '../common/validator/studentDashboardSchema.js';
import * as scheduleChangeRequestService from '../services/scheduleChangeRequest.service.js';

export const listScheduleChangeRequests = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  const data = await scheduleChangeRequestService.listScheduleChangeRequests(req.user, query);
  return responseCommon(res, data, 'Schedule change requests retrieved successfully', 200, responseCode.SUCCESSED);
});

export const createScheduleChangeRequest = asyncHandler(async (req, res) => {
  const data = await scheduleChangeRequestService.createScheduleChangeRequest(req.user, req.body);
  return responseCommon(res, data, 'Schedule change request created successfully', 201, responseCode.SUCCESSED);
});

export const respondScheduleChangeRequest = asyncHandler(async (req, res) => {
  const data = await scheduleChangeRequestService.respondScheduleChangeRequest(
    req.user,
    req.params.requestId,
    req.body,
  );
  return responseCommon(res, data, 'Schedule change request responded successfully', 200, responseCode.SUCCESSED);
});

export const updateScheduleChangeRequest = asyncHandler(async (req, res) => {
  const data = await scheduleChangeRequestService.updateScheduleChangeRequest(
    req.user,
    req.params.requestId,
    req.body,
  );
  return responseCommon(res, data, 'Schedule change request updated successfully', 200, responseCode.SUCCESSED);
});

export const withdrawScheduleChangeRequest = asyncHandler(async (req, res) => {
  const data = await scheduleChangeRequestService.withdrawScheduleChangeRequest(req.user, req.params.requestId);
  return responseCommon(res, data, 'Schedule change request withdrawn successfully', 200, responseCode.SUCCESSED);
});
