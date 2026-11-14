import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import {
  uploadClassMaterialFile,
  requireClassMaterialFile,
  validateClassMaterialFileContent,
} from '../common/middlewares/classMaterialUpload.middleware.js';
import { validator } from '../common/validator/validator.js';
import { createClassMaterialSchema, updateClassMaterialSchema } from '../common/validator/classMaterialSchema.js';
import { assertRole } from '../common/utils/assertRole.js';
import { ENUMS } from '../models/enums.js';
import {
  createClassMaterial,
  deleteClassMaterial,
  getClassMaterials,
  updateClassMaterial,
} from '../controllers/classMaterial.controller.js';

export const classMaterialRoutes = Router();

const tutorOnly = (req, res, next) => {
  assertRole(req.user, ENUMS.UserRole.TUTOR);
  return next();
};

// hàm add, create
classMaterialRoutes.post(
  '/:classId/materials',
  authentication, // validate token
  tutorOnly, // validate role tutor 
  uploadClassMaterialFile, 
  validator(createClassMaterialSchema),
  requireClassMaterialFile,
  validateClassMaterialFileContent,
  createClassMaterial,
);

// hàm lấy all material của 1 class
classMaterialRoutes.get(
  '/:classId/materials',
  authentication,
  authorize('TUTOR', 'STUDENT', 'PARENT'),
  getClassMaterials);

// hàm update
classMaterialRoutes.patch(
  '/:classId/materials/:materialId',
  authentication,
  tutorOnly,
  uploadClassMaterialFile,
  validator(updateClassMaterialSchema),
  validateClassMaterialFileContent,
  updateClassMaterial,
);

// hàm delete material
classMaterialRoutes.delete('/:classId/materials/:materialId', authentication, tutorOnly, deleteClassMaterial);
