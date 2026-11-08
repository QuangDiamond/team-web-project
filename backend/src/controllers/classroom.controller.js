import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { AppError } from '../common/utils/AppError.js';
import { paginationQuerySchema } from '../common/validator/studentDashboardSchema.js';
import * as classroomService from '../services/classroom.service.js';

const parsePagination = (query) => {
  const result = paginationQuerySchema.safeParse(query);
  if (!result.success) {
    throw new AppError(result.error.issues[0].message, 422, result.error.flatten().fieldErrors);
  }
  return result.data;
};

export const getMyClassrooms = asyncHandler(async (req, res) => {
  const data = await classroomService.getMyClassrooms(req.user.id, parsePagination(req.query));
  return responseCommon(res, data, 'Get classrooms successfully!', 200, responseCode.SUCCESSED);
});
