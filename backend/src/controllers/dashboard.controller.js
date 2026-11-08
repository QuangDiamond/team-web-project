import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import * as dashboardService from '../services/dashboard.service.js';

export const parentSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getParentSummary(req.user);
  return responseCommon(res, data, 'Get parent dashboard summary successfully!', 200, responseCode.SUCCESSED);
});

export const tutorSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getTutorSummary(req.user);
  return responseCommon(res, data, 'Get tutor dashboard summary successfully!', 200, responseCode.SUCCESSED);
});
