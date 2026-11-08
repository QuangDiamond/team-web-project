import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import {
  confirmAgreementSchema,
  proposeAgreementSchema,
  rateTutorSchema,
} from '../common/validator/agreementSchema.js';
import * as agreementController from '../controllers/agreement.controller.js';

export const agreementRoutes = Router();

// TODO: authorize('PARENT', 'TUTOR') — middleware chưa có (AGENTS.md: Planned)
agreementRoutes.get('/', authentication, agreementController.getConnections);
agreementRoutes.post('/propose', authentication, validator(proposeAgreementSchema), agreementController.proposeAgreement);
agreementRoutes.post('/:agreementId/confirm', authentication, validator(confirmAgreementSchema), agreementController.confirmAgreement);
agreementRoutes.post('/:agreementId/rate', authentication, validator(rateTutorSchema), agreementController.rateTutor);
