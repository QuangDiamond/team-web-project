// Nhóm thành viên trong lớp học (UC33: Class Groups / Sub-groups)
import mongoose from 'mongoose';
const { Schema } = mongoose;

const classGroupSchema = new Schema(
  {
    // Lớp học chứa nhóm
    class_id:            { type: Schema.Types.ObjectId, ref: 'Classroom', required: true, index: true },
    // Tên nhóm (Ví dụ: Nhóm chung cả lớp, Nhóm 1, Nhóm dự án...)
    name:                { type: String, required: true, trim: true },
    // Gia sư tạo / quản trị nhóm
    tutor_profile_id:    { type: Schema.Types.ObjectId, ref: 'TutorProfile', default: null },
    // Nhóm mặc định tự tạo khi khởi tạo lớp học (Case 7.1)
    is_default:          { type: Boolean, default: false },
    // Chế độ chỉ gia sư mới được đăng tin (Case 7.5)
    only_tutor_can_post: { type: Boolean, default: false },
    // Danh sách ID tài khoản người dùng thuộc nhóm (Học sinh, Phụ huynh)
    member_user_ids:     [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    collection: 'CLASS_GROUPS',
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
  }
);

classGroupSchema.index({ class_id: 1, name: 1 });

export const ClassGroup = mongoose.model('ClassGroup', classGroupSchema);

