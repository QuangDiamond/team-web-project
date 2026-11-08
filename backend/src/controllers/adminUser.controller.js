import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { getPagination, buildPagination, parseQuery } from '../common/utils/pagination.js';
import { userQuerySchema } from '../common/validator/adminUserSchema.js';
import * as adminUserService from '../services/adminUser.service.js';

// Thông tin Admin đang thao tác, dùng để ghi audit log (BR-16)
const getAdminContext = (req) => {
  return {
    adminUserId: req.user.id,
    ipAddress: req.ip,
  };
};

export const getUsers = asyncHandler(async (req, res) => {
  const filters = parseQuery(userQuerySchema, req.query);
  const { page, limit, skip } = getPagination(req.query);
  const result = await adminUserService.listUsers(filters, skip, limit);
  const data = { items: result.items, pagination: buildPagination(page, limit, result.total) };
  return responseCommon(res, data, 'Get users successfully!', 200, responseCode.SUCCESSED);
});

export const getUserDetail = asyncHandler(async (req, res) => {
  const data = await adminUserService.getUserDetail(req.params.id);
  return responseCommon(res, data, 'Get user successfully!', 200, responseCode.SUCCESSED);
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await adminUserService.updateUserStatus(req.params.id, req.body, getAdminContext(req));
  return responseCommon(res, user, 'Update account status successfully!', 200, responseCode.SUCCESSED);
});

export const createAdmin = asyncHandler(async (req, res) => {
  const data = await adminUserService.createAdmin(req.body, getAdminContext(req));
  return responseCommon(res, data, 'Create admin successfully!', 201, responseCode.SUCCESSED);
});
