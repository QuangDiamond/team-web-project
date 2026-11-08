import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import { paginationQuerySchema } from '../common/validator/studentDashboardSchema.js';
import * as aiSuggestionService from '../services/aiSuggestion.service.js';

export const getSuggestions = asyncHandler(async (req, res) => {
  const data = await aiSuggestionService.getSuggestions(req.user, req.params.requestId, parseQuery(paginationQuerySchema, req.query));
  return responseCommon(res, data, 'Get tutor suggestions successfully!', 200, responseCode.SUCCESSED);
});

export const refreshSuggestions = asyncHandler(async (req, res) => {
  const data = await aiSuggestionService.refreshSuggestions(req.user, req.params.requestId, req.body.weights);
  return responseCommon(res, data, 'Tutor suggestions refreshed successfully!', 200, responseCode.SUCCESSED);
});
