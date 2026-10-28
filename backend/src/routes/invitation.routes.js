import { Router } from 'express';
import * as invitationController from '../controllers/invitation.controller.js';

export const invitationRoutes = Router();

// Lấy danh sách lời mời dạy gửi tới gia sư (UC17 / SC29 Invitations Inbox)
invitationRoutes.get('/', invitationController.getInvitations);
invitationRoutes.get('/tutor/:tutorProfileId', invitationController.getInvitations);

// Gia sư phản hồi lời mời: Chấp nhận / Tiếp tục (Continue) hoặc Từ chối (Skip / Decline)
invitationRoutes.post('/:invitationId/respond', invitationController.respondInvitation);
