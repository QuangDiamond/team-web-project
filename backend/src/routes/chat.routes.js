import { Router } from 'express';
import { authentication, authorize } from '../common/middlewares/auth.middleware.js';
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

chatRoutes.get('/conversations', authentication, authorize('PARENT', 'TUTOR'), listConversations);
chatRoutes.get('/conversations/:id', authentication, authorize('PARENT', 'TUTOR'), getConversation);
chatRoutes.get('/conversations/:id/messages', authentication, authorize('PARENT', 'TUTOR'), listMessages);
chatRoutes.post('/conversations/:id/messages', authentication, authorize('PARENT', 'TUTOR'), validator(sendMessageSchema), sendMessage);
// Không có body nên không cần validator
chatRoutes.post('/conversations/:id/read', authentication, authorize('PARENT', 'TUTOR'), markConversationRead);
