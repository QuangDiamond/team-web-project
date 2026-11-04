import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import { invitationListQuerySchema } from '../common/validator/invitationSchema.js';
import * as invitationService from '../services/invitation.service.js';

export const createInvitation = asyncHandler(async (req, res) => {
  const data = await invitationService.createInvitation(req.user, req.body);
  return responseCommon(res, data, 'Invitation sent successfully!', 201, responseCode.SUCCESSED);
});

export const listMyInvitations = asyncHandler(async (req, res) => {
  const query = parseQuery(invitationListQuerySchema, req.query);
  const data = await invitationService.listMyInvitations(req.user, query);
  return responseCommon(res, data, 'Get invitations successfully!', 200, responseCode.SUCCESSED);
});

export const cancelInvitation = asyncHandler(async (req, res) => {
  const data = await invitationService.cancelInvitation(req.user, req.params.id);
  return responseCommon(res, data, 'Invitation cancelled!', 200, responseCode.SUCCESSED);
});

export const listReceivedInvitations = asyncHandler(async (req, res) => {
  const query = parseQuery(invitationListQuerySchema, req.query);
  const data = await invitationService.listReceivedInvitations(req.user, query);
  return responseCommon(res, data, 'Get received invitations successfully!', 200, responseCode.SUCCESSED);
});

export const acceptInvitation = asyncHandler(async (req, res) => {
  const data = await invitationService.acceptInvitation(req.user, req.params.id);
  return responseCommon(res, data, 'Invitation accepted, conversation opened!', 200, responseCode.SUCCESSED);
});

export const declineInvitation = asyncHandler(async (req, res) => {
  const data = await invitationService.declineInvitation(req.user, req.params.id);
  return responseCommon(res, data, 'Invitation declined!', 200, responseCode.SUCCESSED);
});
