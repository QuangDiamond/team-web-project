import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import * as agreementService from '../services/agreement.service.js';

export const getConnections = asyncHandler(async (req, res) => {
  const result = await agreementService.getConnections(req.user?.id);
  return responseCommon(
    res,
    result,
    'Lấy danh sách thỏa thuận kết nối thành công!',
    200,
    responseCode.SUCCESSED
  );
});

export const proposeAgreement = asyncHandler(async (req, res) => {
  const result = await agreementService.proposeAgreement({
    conversationId: req.body.conversationId,
    proposerUserId: req.user?.id || req.body.proposerUserId,
    agreedSubject: req.body.agreedSubject,
    agreedSchedule: req.body.agreedSchedule,
    agreedPrice: req.body.agreedPrice,
  });
  return responseCommon(
    res,
    result,
    result.message,
    201,
    responseCode.SUCCESSED
  );
});

export const confirmAgreement = asyncHandler(async (req, res) => {
  const result = await agreementService.confirmAgreement(req.params.agreementId, {
    action: req.body.action,
    userId: req.user?.id || req.body.userId,
  });
  return responseCommon(
    res,
    result,
    result.message,
    200,
    responseCode.SUCCESSED
  );
});
