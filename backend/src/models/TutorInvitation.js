// Lời mời phụ huynh gửi cho gia sư gắn với một yêu cầu; gia sư chọn Continue (trừ 1 credit, mở chat)
// hoặc Skip (UC16, UC17)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const tutorInvitationSchema = new Schema(
  {
    // Parent sender (UC16)
    parent_user_id:   { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Tutor receiver (UC16)
    tutor_profile_id: { type: Schema.Types.ObjectId, ref: 'TutorProfile', default: null },
    // Selected open request (E1 UK pair)
    request_id:       { type: Schema.Types.ObjectId, ref: 'ParentRequest', default: null },
    // Optional message (Step 2)
    message:          { type: String, default: null },
    // PENDING, - chờ tutor rep ACCEPTED - tutor đồng ý với đề nghị -> mở conversation DECLINED, - đã bị tutor từ…
    status:           { type: String, enum: Object.values(ENUMS.TutorInvitationsStatus), default: null },
  },
  {
    collection: 'TUTOR_INVITATIONS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
tutorInvitationSchema.index({ request_id: 1, tutor_profile_id: 1 }, { unique: true });
tutorInvitationSchema.index({ tutor_profile_id: 1, status: 1 });

export const TutorInvitation = mongoose.model('TutorInvitation', tutorInvitationSchema);
