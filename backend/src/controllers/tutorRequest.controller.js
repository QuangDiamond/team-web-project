import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import { paginationQuerySchema } from '../common/validator/studentDashboardSchema.js';
import { tutorRequestListQuerySchema } from '../common/validator/tutorRequestSchema.js';
import * as tutorRequestService from '../services/tutorRequest.service.js';

export const browseRequests = asyncHandler(async (req, res) => {
  const query = parseQuery(tutorRequestListQuerySchema, req.query);
  const data = await tutorRequestService.browseRequests(req.user, query);
  return responseCommon(res, data, 'Get open requests successfully!', 200, responseCode.SUCCESSED);
});

export const getFilterOptions = asyncHandler(async (req, res) => {
  const data = await tutorRequestService.getFilterOptions(req.user);
  return responseCommon(res, data, 'Get filter options successfully!', 200, responseCode.SUCCESSED);
});

export const getRequestDetail = asyncHandler(async (req, res) => {
  const data = await tutorRequestService.getRequestDetail(req.user, req.params.id);
  return responseCommon(res, data, 'Get request successfully!', 200, responseCode.SUCCESSED);
});

export const listBookmarks = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  const data = await tutorRequestService.listBookmarks(req.user, query);
  return responseCommon(res, data, 'Get saved requests successfully!', 200, responseCode.SUCCESSED);
});

export const addBookmark = asyncHandler(async (req, res) => {
  const data = await tutorRequestService.addBookmark(req.user, req.params.id);
  return responseCommon(res, data, 'Request saved!', 200, responseCode.SUCCESSED);
});

export const removeBookmark = asyncHandler(async (req, res) => {
  const data = await tutorRequestService.removeBookmark(req.user, req.params.id);
  return responseCommon(res, data, 'Request removed from saved!', 200, responseCode.SUCCESSED);
});

export const getSuggestions = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  const data = await tutorRequestService.getSuggestions(req.user, query);
  return responseCommon(res, data, 'Get suggested requests successfully!', 200, responseCode.SUCCESSED);
});

export const refreshSuggestions = asyncHandler(async (req, res) => {
  const data = await tutorRequestService.refreshSuggestions(req.user);
  return responseCommon(res, data, 'Suggested requests refreshed successfully!', 200, responseCode.SUCCESSED);
});
