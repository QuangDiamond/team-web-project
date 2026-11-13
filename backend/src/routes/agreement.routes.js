import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import {
  confirmAgreementSchema,
  proposeAgreementSchema,
  rateTutorSchema,
} from '../common/validator/agreementSchema.js';
import * as agreementController from '../controllers/agreement.controller.js';

export const agreementRoutes = Router();

// UC16 – Confirm Tutoring Agreement (PARENT, TUTOR)
agreementRoutes.get('/', authentication, authorize('PARENT', 'TUTOR'), agreementController.getConnections);
agreementRoutes.post('/propose', authentication, authorize('PARENT', 'TUTOR'), validator(proposeAgreementSchema), agreementController.proposeAgreement);
agreementRoutes.post('/:agreementId/confirm', authentication, authorize('PARENT', 'TUTOR'), validator(confirmAgreementSchema), agreementController.confirmAgreement);
// UC36 – chỉ phụ huynh được đánh giá gia sư (BR-07)
agreementRoutes.post('/:agreementId/rate', authentication, authorize('PARENT'), validator(rateTutorSchema), agreementController.rateTutor);
