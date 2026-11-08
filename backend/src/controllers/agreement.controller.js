import { asyncHandler } from '../common/utils/asyncHandler.js';
import { responseCommon } from '../common/response.js';
import * as agreementService from '../services/agreement.service.js';

export const getConnections = asyncHandler(async (req, res) => {
  const result = await agreementService.getConnections(req.user);
  return responseCommon(res, 200, {
    success: 1,
    message: 'Lấy danh sách thỏa thuận kết nối thành công.',
    data: result,
  });
});

export const proposeAgreement = asyncHandler(async (req, res) => {
  const result = await agreementService.proposeAgreement(req.user, req.body);
  return responseCommon(res, 201, {
    success: 1,
    message: result.message,
    data: result,
  });
});

export const confirmAgreement = asyncHandler(async (req, res) => {
  const { agreementId } = req.params;
  const result = await agreementService.confirmAgreement(req.user, agreementId, req.body);
  return responseCommon(res, 200, {
    success: 1,
    message: result.message,
    data: result,
  });
});

export const rateTutor = asyncHandler(async (req, res) => {
  const { agreementId } = req.params;
  const result = await agreementService.rateTutor(req.user, agreementId, req.body);
  return responseCommon(res, 201, {
    success: 1,
    message: result.message,
    data: result,
  });
});
