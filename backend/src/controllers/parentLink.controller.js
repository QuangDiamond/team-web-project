import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import { parentLinkListQuerySchema } from '../common/validator/parentLinkSchema.js';
import * as parentLinkService from '../services/parentLink.service.js';

export const inviteStudent = asyncHandler(async (req, res) => {
  await parentLinkService.inviteStudent(req.user, req.body);
  // Luôn cùng một thông báo để không lộ email nào là tài khoản học sinh
  const message = 'If the email belongs to an active student account, the invitation has been sent';
  return responseCommon(res, null, message, 201, responseCode.SUCCESSED);
});

export const listMyLinks = asyncHandler(async (req, res) => {
  const query = parseQuery(parentLinkListQuerySchema, req.query);
  const data = await parentLinkService.listMyLinks(req.user, query);
  return responseCommon(res, data, 'Get parent links successfully!', 200, responseCode.SUCCESSED);
});

export const respondToLink = asyncHandler(async (req, res) => {
  const data = await parentLinkService.respondToLink(req.user, req.params.linkId, req.body);
  return responseCommon(res, data, 'Link invitation answered successfully!', 200, responseCode.SUCCESSED);
});

export const removeLink = asyncHandler(async (req, res) => {
  const data = await parentLinkService.removeLink(req.user, req.params.linkId);
  return responseCommon(res, data, 'Link removed successfully!', 200, responseCode.SUCCESSED);
});
