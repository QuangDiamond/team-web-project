import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import { parentRequestListQuerySchema } from '../common/validator/parentRequestSchema.js';
import * as parentRequestService from '../services/parentRequest.service.js';

export const listChildren = asyncHandler(async (req, res) => {
  const data = await parentRequestService.listChildren(req.user);
  return responseCommon(res, data, 'Get children successfully!', 200, responseCode.SUCCESSED);
});

export const listMyRequests = asyncHandler(async (req, res) => {
  const query = parseQuery(parentRequestListQuerySchema, req.query);
  const data = await parentRequestService.listMyRequests(req.user, query);
  return responseCommon(res, data, 'Get tutoring requests successfully!', 200, responseCode.SUCCESSED);
});

export const getMyRequest = asyncHandler(async (req, res) => {
  const data = await parentRequestService.getMyRequest(req.user, req.params.id);
  return responseCommon(res, data, 'Get tutoring request successfully!', 200, responseCode.SUCCESSED);
});

export const createRequest = asyncHandler(async (req, res) => {
  const data = await parentRequestService.createRequest(req.user, req.body);
  return responseCommon(res, data, 'Tutoring request published successfully!', 201, responseCode.SUCCESSED);
});

export const updateRequest = asyncHandler(async (req, res) => {
  const data = await parentRequestService.updateRequest(req.user, req.params.id, req.body);
  return responseCommon(res, data, 'Tutoring request updated successfully!', 200, responseCode.SUCCESSED);
});

export const deleteRequest = asyncHandler(async (req, res) => {
  const data = await parentRequestService.deleteRequest(req.user, req.params.id);
  return responseCommon(res, data, 'Tutoring request deleted successfully!', 200, responseCode.SUCCESSED);
});
