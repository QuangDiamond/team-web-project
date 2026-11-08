import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import { tutorPostListQuerySchema } from '../common/validator/tutorPostSchema.js';
import * as tutorPostService from '../services/tutorPost.service.js';

export const listMyPosts = asyncHandler(async (req, res) => {
  const query = parseQuery(tutorPostListQuerySchema, req.query);
  const data = await tutorPostService.listMyPosts(req.user, query);
  return responseCommon(res, data, 'Get tutor posts successfully!', 200, responseCode.SUCCESSED);
});

export const getMyPost = asyncHandler(async (req, res) => {
  const data = await tutorPostService.getMyPost(req.user, req.params.id);
  return responseCommon(res, data, 'Get tutor post successfully!', 200, responseCode.SUCCESSED);
});

export const createPost = asyncHandler(async (req, res) => {
  const data = await tutorPostService.createPost(req.user, req.body);
  return responseCommon(res, data, 'Tutor post created successfully!', 201, responseCode.SUCCESSED);
});

export const updatePost = asyncHandler(async (req, res) => {
  const data = await tutorPostService.updatePost(req.user, req.params.id, req.body);
  return responseCommon(res, data, 'Tutor post updated successfully!', 200, responseCode.SUCCESSED);
});

export const changePostStatus = asyncHandler(async (req, res) => {
  const data = await tutorPostService.changePostStatus(req.user, req.params.id, req.body.status);
  return responseCommon(res, data, 'Tutor post status updated successfully!', 200, responseCode.SUCCESSED);
});

export const deletePost = asyncHandler(async (req, res) => {
  const data = await tutorPostService.deletePost(req.user, req.params.id);
  return responseCommon(res, data, 'Tutor post deleted successfully!', 200, responseCode.SUCCESSED);
});
