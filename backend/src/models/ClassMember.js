// Thành viên của lớp (học sinh, phụ huynh), vai trò và trạng thái trong lớp; phụ huynh gắn với học
// sinh là con mình (UC23, UC24)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const classMemberSchema = new Schema(
  {
    // Liên kết lớp học
    class_id:       { type: Schema.Types.ObjectId, ref: 'Classroom', default: null },
    // Tài khoản thành viên tham gia
    user_id:        { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Thời điểm tham gia lớp
    joined_at:      { type: Date, default: null },
    status:         { type: String, enum: Object.values(ENUMS.ClassMembersStatus), default: null },
    // Lý do xóa thành viên
    removal_reason: { type: String, default: null },
  },
  {
    collection: 'CLASS_MEMBERS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
classMemberSchema.index({ class_id: 1, user_id: 1 }, { unique: true });
classMemberSchema.index({ user_id: 1 });

export const ClassMember = mongoose.model('ClassMember', classMemberSchema);
