import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import * as tutorProfileService from '../services/tutorProfile.service.js';

export const getMyProfile = asyncHandler(async (req, res) => {
  const data = await tutorProfileService.getMyProfile(req.user);
  return responseCommon(res, data, 'Get tutor profile successfully!', 200, responseCode.SUCCESSED);
});

export const saveMyProfile = asyncHandler(async (req, res) => {
  const data = await tutorProfileService.saveMyProfile(req.user, req.body);
  let statusCode = 200;
  let message = 'Tutor profile updated successfully!';
  if (data.created) {
    statusCode = 201;
    message = 'Tutor profile created successfully!';
  }
  return responseCommon(res, data, message, statusCode, responseCode.SUCCESSED);
});
