import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { createInvitationSchema } from '../common/validator/invitationSchema.js';
import {
  acceptInvitation,
  cancelInvitation,
  createInvitation,
  declineInvitation,
  listMyInvitations,
  listReceivedInvitations,
} from '../controllers/invitation.controller.js';

// UC14 – Invite Tutor (Parent)
export const invitationRoutes = Router();

// TODO: authorize('PARENT') cho gửi / xem / hủy lời mời, authorize('TUTOR') cho received / accept / decline — middleware chưa có
// (AGENTS.md: Planned); tạm thời service kiểm tra role, quyền sở hữu và hồ sơ gia sư
invitationRoutes.post('/', authentication, validator(createInvitationSchema), createInvitation);
invitationRoutes.get('/mine', authentication, listMyInvitations);
// Không có body nên không cần validator
invitationRoutes.patch('/:id/cancel', authentication, cancelInvitation);
// Gia sư xem và phản hồi lời mời. Accept mở hội thoại 1-1. Không có body nên không cần validator
invitationRoutes.get('/received', authentication, listReceivedInvitations);
invitationRoutes.patch('/:id/accept', authentication, acceptInvitation);
invitationRoutes.patch('/:id/decline', authentication, declineInvitation);
