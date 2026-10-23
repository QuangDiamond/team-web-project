// Thông báo gia sư đăng trên bảng tin của lớp, có thể ghim (UC22)
import mongoose from 'mongoose';
const { Schema } = mongoose;

const classAnnouncementSchema = new Schema(
  {
    // Liên kết lớp học
    class_id:          { type: Schema.Types.ObjectId, ref: 'Classroom', default: null },
    // Profile gia sư đăng bài
    author_profile_id: { type: Schema.Types.ObjectId, ref: 'TutorProfile', default: null },
    // Nội dung rich text (Tối đa 5000 ký tự)
    content:           { type: String, default: null },
    // Cờ ghim bài viết lên đầu
    is_pinned:         { type: Boolean, default: null },
  },
  {
    collection: 'CLASS_ANNOUNCEMENTS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
  }
);

export const ClassAnnouncement = mongoose.model('ClassAnnouncement', classAnnouncementSchema);
