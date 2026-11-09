import { responseCode } from '../common/constants/constants.js';
import { responseCommon } from '../common/response.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';
import { parseQuery } from '../common/utils/pagination.js';
import { paginationQuerySchema } from '../common/validator/studentDashboardSchema.js';
import * as classMaterialService from '../services/classMaterial.service.js';

export const getClassMaterials = asyncHandler(async (req, res) => {
  const query = parseQuery(paginationQuerySchema, req.query);
  const data = await classMaterialService.getClassMaterials(req.user, req.params.classId, query);
  return responseCommon(res, data, 'Class materials retrieved successfully!', 200, responseCode.SUCCESSED);
});

export const createClassMaterial = asyncHandler(async (req, res) => {
  const data = await classMaterialService.createClassMaterial(
    req.user,
    req.params.classId,
    req.body,
    req.file,
  );
  return responseCommon(res, data, 'Class material created successfully!', 201, responseCode.SUCCESSED);
});

export const updateClassMaterial = asyncHandler(async (req, res) => {
  const data = await classMaterialService.updateClassMaterial(
    req.user,
    req.params.classId,
    req.params.materialId,
    req.body,
    req.file,
  );
  const message = data.old_file_deleted
    ? 'Class material updated successfully!'
    : 'Class material updated, but the previous Cloudinary file could not be removed.';
  return responseCommon(res, data, message, 200, responseCode.SUCCESSED);
});

export const deleteClassMaterial = asyncHandler(async (req, res) => {
  const data = await classMaterialService.deleteClassMaterial(req.user, req.params.classId, req.params.materialId);
  const message = data.cloudinary_deleted
    ? 'Class material deleted successfully!'
    : 'Class material deleted, but its Cloudinary file could not be removed.';
  return responseCommon(res, data, message, 200, responseCode.SUCCESSED);
});
