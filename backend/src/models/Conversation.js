// Cuộc trò chuyện: chat 1-1 phụ huynh - gia sư (mở sau khi bấm Continue, UC15/UC17) hoặc chat nhóm của
// lớp học (UC33, UC34)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
import { conversationReadStateSchema } from './schemas/ConversationReadState.schema.js';
const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    // ID tài khoản Phụ huynh tham gia chat
    parent_user_id:   { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // ID profile Gia sư tham gia chat
    tutor_profile_id: { type: Schema.Types.ObjectId, ref: 'TutorProfile', default: null },
    // Trạng thái chat đang hoạt động (Dùng kiểm tra luồng A1 - Continue in chat / UC34)
    is_active:        { type: Boolean, default: null },
    // Associated tutoring request
    request_id:       { type: Schema.Types.ObjectId, ref: 'ParentRequest', default: null },
    // Liên kết 1-1 với lớp học
    class_id:         { type: Schema.Types.ObjectId, ref: 'Classroom', default: null },
    // Value: DIRECT - trực tiếp 1-1 CLASS_GROUP_CHAT.: group chat của lớp CLASS_GROUP_CHAT
    type:             { type: String, enum: Object.values(ENUMS.ConversationsType), default: null },
    // EMBED từ bảng CONVERSATION_READ_STATES: mỗi phòng chat ít người; cập nhật bằng $set read_states.$
    read_states:      { type: [conversationReadStateSchema], default: [] },
  },
  {
    collection: 'CONVERSATIONS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
conversationSchema.index({ class_id: 1 }, { unique: true, partialFilterExpression: { class_id: { $type: 'objectId' } } });
conversationSchema.index({ parent_user_id: 1 });
conversationSchema.index({ tutor_profile_id: 1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
