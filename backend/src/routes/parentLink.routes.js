import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { inviteStudentSchema, respondParentLinkSchema } from '../common/validator/parentLinkSchema.js';
import { inviteStudent, listMyLinks, removeLink, respondToLink } from '../controllers/parentLink.controller.js';

// Liên kết phụ huynh – học sinh bằng lời mời xác nhận (độc lập với lớp học)
export const parentLinkRoutes = Router();

parentLinkRoutes.get('/', authentication, authorize('PARENT', 'STUDENT'), listMyLinks);
parentLinkRoutes.post('/', authentication, authorize('PARENT'), validator(inviteStudentSchema), inviteStudent);
parentLinkRoutes.post('/:linkId/respond', authentication, authorize('STUDENT'), validator(respondParentLinkSchema), respondToLink);
// Không có body nên không cần validator
parentLinkRoutes.delete('/:linkId', authentication, authorize('PARENT', 'STUDENT'), removeLink);
