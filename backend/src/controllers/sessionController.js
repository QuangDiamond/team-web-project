import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import { paginationQuerySchema } from '../common/validator/studentDashboardSchema.js';
import * as sessionService from '../services/sessionService.js';

export const getUserSessions = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  const data = await sessionService.getUserSessions(req.user, query);
  return responseCommon(res, data, 'Sessions retrieved successfully!', 200, responseCode.SUCCESSED);
});
