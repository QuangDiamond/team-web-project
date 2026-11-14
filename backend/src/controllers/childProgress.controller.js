import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import { paginationQuerySchema } from '../common/validator/studentDashboardSchema.js';
import * as childProgressService from '../services/childProgress.service.js';

// UC35 – Monitor Child Progress. Mọi API đều theo một người con đã liên kết với phụ huynh đang đăng nhập

export const getChildSummary = asyncHandler(async (req, res) => {
  const data = await childProgressService.getChildSummary(req.user, req.params.childId);
  return responseCommon(res, data, 'Get child progress successfully!', 200, responseCode.SUCCESSED);
});

export const listChildClasses = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  const data = await childProgressService.listChildClasses(req.user, req.params.childId, query);
  return responseCommon(res, data, 'Get child classes successfully!', 200, responseCode.SUCCESSED);
});

export const listChildUpcomingSessions = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  const data = await childProgressService.listChildUpcomingSessions(req.user, req.params.childId, query);
  return responseCommon(res, data, 'Get child upcoming sessions successfully!', 200, responseCode.SUCCESSED);
});

export const listChildAttendance = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  const data = await childProgressService.listChildAttendance(req.user, req.params.childId, query);
  return responseCommon(res, data, 'Get child attendance successfully!', 200, responseCode.SUCCESSED);
});

export const listChildResults = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  const data = await childProgressService.listChildResults(req.user, req.params.childId, query);
  return responseCommon(res, data, 'Get child results successfully!', 200, responseCode.SUCCESSED);
});

export const getChildScoreTrend = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  const data = await childProgressService.getChildScoreTrend(req.user, req.params.childId, query);
  return responseCommon(res, data, 'Get child score trend successfully!', 200, responseCode.SUCCESSED);
});

export const getChildResultDetail = asyncHandler(async (req, res) => {
  const data = await childProgressService.getChildResultDetail(req.user, req.params.childId, req.params.submissionId);
  return responseCommon(res, data, 'Get child result successfully!', 200, responseCode.SUCCESSED);
});
