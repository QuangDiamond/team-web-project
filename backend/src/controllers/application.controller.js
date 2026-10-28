import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import * as applicationService from '../services/application.service.js';

export const getApplications = asyncHandler(async (req, res) => {
  const result = await applicationService.getApplicationsByRequest(req.params.requestId);
  return responseCommon(
    res,
    result,
    'Lấy danh sách gia sư ứng tuyển thành công!',
    200,
    responseCode.SUCCESSED
  );
});

export const respondApplication = asyncHandler(async (req, res) => {
  const result = await applicationService.respondToApplication(req.params.applicationId, {
    action: req.body.action,
    parentUserId: req.user?.id || req.body.parentUserId,
  });
  return responseCommon(
    res,
    result,
    result.message,
    200,
    responseCode.SUCCESSED
  );
});
