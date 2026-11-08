import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import * as discoveryService from '../services/discovery.service.js';

export const getTutorProfile = asyncHandler(async (req, res) => {
  const data = await discoveryService.getTutorPublicProfile(req.params.profileId, req.query);
  return responseCommon(res, data, 'Get tutor public profile successfully');
});

export const getParentProfile = asyncHandler(async (req, res) => {
  const data = await discoveryService.getParentPublicProfile(req.params.userId, req.query);
  return responseCommon(res, data, 'Get parent public profile successfully');
});
