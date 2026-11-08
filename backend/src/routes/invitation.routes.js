import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { createInvitationSchema } from '../common/validator/invitationSchema.js';
import {
  acceptInvitation,
  cancelInvitation,
  createInvitation,
  declineInvitation,
  listInvitableTutors,
  listMyInvitations,
  listReceivedInvitations,
} from '../controllers/invitation.controller.js';

// UC14 – Invite Tutor (Parent)
export const invitationRoutes = Router();

invitationRoutes.post('/', authentication, authorize('PARENT'), validator(createInvitationSchema), createInvitation);
// Danh sách gia sư đang hoạt động để xem và mời
invitationRoutes.get('/tutors', authentication, authorize('PARENT'), listInvitableTutors);
invitationRoutes.get('/mine', authentication, authorize('PARENT'), listMyInvitations);
// Không có body nên không cần validator
invitationRoutes.patch('/:id/cancel', authentication, authorize('PARENT'), cancelInvitation);
// Gia sư xem và phản hồi lời mời. Accept mở hội thoại 1-1. Không có body nên không cần validator
invitationRoutes.get('/received', authentication, authorize('TUTOR'), listReceivedInvitations);
invitationRoutes.patch('/:id/accept', authentication, authorize('TUTOR'), acceptInvitation);
invitationRoutes.patch('/:id/decline', authentication, authorize('TUTOR'), declineInvitation);
