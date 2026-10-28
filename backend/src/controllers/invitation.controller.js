import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import * as invitationService from '../services/invitation.service.js';

export const getInvitations = asyncHandler(async (req, res) => {
  const result = await invitationService.getInvitations(req.params.tutorProfileId || req.query.tutorProfileId);
  return responseCommon(
    res,
    result,
    'Lấy danh sách lời mời dạy thành công!',
    200,
    responseCode.SUCCESSED
  );
});

export const respondInvitation = asyncHandler(async (req, res) => {
  const result = await invitationService.respondToInvitation(req.params.invitationId, {
    action: req.body.action,
    reason: req.body.reason,
    tutorUserId: req.user?.id || req.body.tutorUserId,
  });
  return responseCommon(
    res,
    result,
    result.message,
    200,
    responseCode.SUCCESSED
  );
});
