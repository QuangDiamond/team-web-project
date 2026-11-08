import { Router } from 'express';
import { authentication } from '../common/middlewares/auth.middleware.js';
import { validator } from '../common/validator/validator.js';
import { sendMessageSchema } from '../common/validator/chatSchema.js';
import {
  getConversation,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
} from '../controllers/chat.controller.js';

// Chat 1-1 giữa phụ huynh và gia sư (dạng tải lại / polling, chưa realtime)
export const chatRoutes = Router();

// TODO: authorize('PARENT', 'TUTOR') — middleware chưa có (AGENTS.md: Planned); tạm thời service kiểm tra role và người tham gia
chatRoutes.get('/conversations', authentication, listConversations);
chatRoutes.get('/conversations/:id', authentication, getConversation);
chatRoutes.get('/conversations/:id/messages', authentication, listMessages);
chatRoutes.post('/conversations/:id/messages', authentication, validator(sendMessageSchema), sendMessage);
// Không có body nên không cần validator
chatRoutes.post('/conversations/:id/read', authentication, markConversationRead);
