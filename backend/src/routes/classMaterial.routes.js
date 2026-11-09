import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
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

classMaterialRoutes.post(
  '/:classId/materials',
  authentication,
  tutorOnly,
  uploadClassMaterialFile,
  validator(createClassMaterialSchema),
  requireClassMaterialFile,
  validateClassMaterialFileContent,
  createClassMaterial,
);
classMaterialRoutes.get('/:classId/materials', authentication, tutorOnly, getClassMaterials);
classMaterialRoutes.patch(
  '/:classId/materials/:materialId',
  authentication,
  tutorOnly,
  uploadClassMaterialFile,
  validator(updateClassMaterialSchema),
  requireClassMaterialFile,
  validateClassMaterialFileContent,
  updateClassMaterial,
);
classMaterialRoutes.delete('/:classId/materials/:materialId', authentication, tutorOnly, deleteClassMaterial);
