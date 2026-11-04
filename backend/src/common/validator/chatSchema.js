import { z } from 'zod';

export const MESSAGE_MAX_LENGTH = 2000;

// Body gửi tin nhắn văn bản. strictObject chặn sender_user_id, conversation_id, message_type, attachments...
export const sendMessageSchema = z.strictObject({
  content: z
    .string('Message is required')
    .trim()
    .min(1, 'Message is required')
    .max(MESSAGE_MAX_LENGTH, `Message must be at most ${MESSAGE_MAX_LENGTH} characters`),
});
