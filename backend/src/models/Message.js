// Tin nhắn trong một cuộc trò chuyện (văn bản, ảnh, file, tin hệ thống) (UC34)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
import { messageAttachmentSchema } from './schemas/MessageAttachment.schema.js';
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    // Liên kết phòng chat
    conversation_id: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null },
    // Người gửi tin nhắn
    sender_user_id:  { type: Schema.Types.ObjectId, ref: 'User', default: null },
    message_type:    { type: String, enum: Object.values(ENUMS.MessagesMessageType), default: null },
    // Nội dung văn bản / thông tin SĐT/Zalo
    content:         { type: String, default: null },
    // EMBED từ bảng MESSAGE_ATTACHMENTS: luôn hiển thị cùng tin nhắn
    attachments:     { type: [messageAttachmentSchema], default: [] },
  },
  {
    collection: 'MESSAGES',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
messageSchema.index({ conversation_id: 1, created_at: 1 });

export const Message = mongoose.model('Message', messageSchema);
