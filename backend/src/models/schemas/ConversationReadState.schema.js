// Subdocument nhúng trong CONVERSATIONS.read_states (mảng). Bảng gốc: CONVERSATION_READ_STATES. Lý do
// embed: mỗi phòng chat ít người; cập nhật bằng $set read_states.$
import mongoose from 'mongoose';
const { Schema } = mongoose;

export const conversationReadStateSchema = new Schema(
  {
    // Người dùng đã đọc
    user_id:              { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // ID tin nhắn cuối cùng đã đọc
    last_read_message_id: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    // Timestamp xem tin nhắn cuối
    read_at:              { type: Date, default: null },
  },
  { _id: false }
);
