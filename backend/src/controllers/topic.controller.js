import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import { paginationQuerySchema } from '../common/validator/studentDashboardSchema.js';
import * as topicService from '../services/topic.service.js';

export const getAllTopics = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  const data = await topicService.getAllTopics(req.user, req.params.classId, query);
  return responseCommon(res, data, 'Topics retrieved successfully!', 200, responseCode.SUCCESSED);
});

export const createTopic = asyncHandler(async (req, res) => {
  const data = await topicService.createTopic(req.user, req.params.classId, req.body);
  return responseCommon(res, data, 'Topic created successfully!', 201, responseCode.SUCCESSED);
});

export const updateTopic = asyncHandler(async (req, res) => {
  const data = await topicService.updateTopic(req.user, req.params.classId, req.params.topicId, req.body);
  return responseCommon(res, data, 'Topic updated successfully!', 200, responseCode.SUCCESSED);
});

export const deleteTopic = asyncHandler(async (req, res) => {
  const data = await topicService.deleteTopic(req.user, req.params.classId, req.params.topicId);
  return responseCommon(res, data, 'Topic deleted successfully!', 200, responseCode.SUCCESSED);
});
