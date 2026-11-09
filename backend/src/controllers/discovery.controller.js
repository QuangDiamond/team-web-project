import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import * as discoveryService from '../services/discovery.service.js';
import { searchPublicTutors } from '../services/invitation.service.js';
import { tutorSearchSchema } from '../common/validator/discoverySchema.js';
import { parseQuery } from '../common/utils/pagination.js';

export const listTutors = asyncHandler(async (req, res) => {
  const query = parseQuery(tutorSearchSchema, req.query);
  const data = await searchPublicTutors(query);
  return responseCommon(res, data, 'Get tutors successfully');
});

export const getTutorProfile = asyncHandler(async (req, res) => {
  const data = await discoveryService.getTutorPublicProfile(req.params.profileId, req.query);
  return responseCommon(res, data, 'Get tutor public profile successfully');
});

export const getParentProfile = asyncHandler(async (req, res) => {
  const data = await discoveryService.getParentPublicProfile(req.params.userId, req.query);
  return responseCommon(res, data, 'Get parent public profile successfully');
});
