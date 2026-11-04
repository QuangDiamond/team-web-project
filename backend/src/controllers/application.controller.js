import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import { applicationListQuerySchema } from '../common/validator/applicationSchema.js';
import { paginationQuerySchema } from '../common/validator/studentDashboardSchema.js';
import * as applicationService from '../services/application.service.js';

export const createApplication = asyncHandler(async (req, res) => {
  const data = await applicationService.createApplication(req.user, req.body);
  return responseCommon(res, data, 'Application sent successfully!', 201, responseCode.SUCCESSED);
});

export const listMyApplications = asyncHandler(async (req, res) => {
  const query = parseQuery(applicationListQuerySchema, req.query);
  const data = await applicationService.listMyApplications(req.user, query);
  return responseCommon(res, data, 'Get applications successfully!', 200, responseCode.SUCCESSED);
});

export const withdrawApplication = asyncHandler(async (req, res) => {
  const data = await applicationService.withdrawApplication(req.user, req.params.id);
  return responseCommon(res, data, 'Application withdrawn!', 200, responseCode.SUCCESSED);
});

export const listApplicationsForRequest = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  const data = await applicationService.listApplicationsForRequest(req.user, req.params.id, query);
  return responseCommon(res, data, 'Get applications successfully!', 200, responseCode.SUCCESSED);
});

export const continueApplication = asyncHandler(async (req, res) => {
  const data = await applicationService.continueApplication(req.user, req.params.id);
  return responseCommon(res, data, 'Application continued, conversation opened!', 200, responseCode.SUCCESSED);
});

export const skipApplication = asyncHandler(async (req, res) => {
  const data = await applicationService.skipApplication(req.user, req.params.id);
  return responseCommon(res, data, 'Application skipped!', 200, responseCode.SUCCESSED);
});
