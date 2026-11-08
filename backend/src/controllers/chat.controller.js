import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import { paginationQuerySchema } from '../common/validator/studentDashboardSchema.js';
import * as chatService from '../services/chat.service.js';

export const listConversations = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  const data = await chatService.listConversations(req.user, query);
  return responseCommon(res, data, 'Get conversations successfully!', 200, responseCode.SUCCESSED);
});

export const getConversation = asyncHandler(async (req, res) => {
  const data = await chatService.getConversation(req.user, req.params.id);
  return responseCommon(res, data, 'Get conversation successfully!', 200, responseCode.SUCCESSED);
});

export const listMessages = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  const data = await chatService.listMessages(req.user, req.params.id, query);
  return responseCommon(res, data, 'Get messages successfully!', 200, responseCode.SUCCESSED);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const data = await chatService.sendMessage(req.user, req.params.id, req.body.content);
  return responseCommon(res, data, 'Message sent!', 201, responseCode.SUCCESSED);
});

export const markConversationRead = asyncHandler(async (req, res) => {
  const data = await chatService.markConversationRead(req.user, req.params.id);
  return responseCommon(res, data, 'Conversation marked as read!', 200, responseCode.SUCCESSED);
});
