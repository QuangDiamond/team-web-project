// Liên kết giữa tài khoản phụ huynh và tài khoản học sinh. Phụ huynh gửi yêu cầu, học sinh chấp nhận
// hoặc từ chối; dùng để phụ huynh theo dõi tiến độ của con (UC24 A1, UC37)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const parentChildLinkSchema = new Schema(
  {
    // Tham chiếu USERS (Role PARENT)
    parent_user_id:  { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Tham chiếu USERS (Role STUDENT)
    student_user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status:          { type: String, enum: Object.values(ENUMS.ParentChildLinksStatus), default: null },
  },
  {
    collection: 'PARENT_CHILD_LINKS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
parentChildLinkSchema.index({ parent_user_id: 1, student_user_id: 1 }, { unique: true });

export const ParentChildLink = mongoose.model('ParentChildLink', parentChildLinkSchema);
