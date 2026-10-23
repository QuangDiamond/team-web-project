// Bài đăng quảng cáo dịch vụ dạy học của gia sư (môn, lớp, hình thức, học phí, lịch), hiển thị trong
// kết quả tìm kiếm (UC08)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const decimalToString = (v) => (v == null ? v : v.toString());

const tutorPostSchema = new Schema(
  {
    // Khóa ngoại tham chiếu 1-N đến Profile gia sư tạo bài
    profile_id:    { type: Schema.Types.ObjectId, ref: 'TutorProfile', default: null },
    // Tiêu đề bài đăng gia sư
    title:         { type: String, default: null },
    // Môn học đăng ký giảng dạy
    subject_name:  { type: String, default: null },
    // Khối lớp / Trình độ học viên hướng tới
    grade_level:   { type: String, default: null },
    // Hình thức dạy học
    teaching_mode: { type: String, enum: Object.values(ENUMS.TutorPostsTeachingMode), default: null },
    // Mức học phí theo giờ hoặc theo buổi
    price:         { type: Schema.Types.Decimal128, default: null, get: decimalToString },
    // Mô tả khung giờ/lịch rảnh có thể dạy
    schedule:      { type: String, default: null },
    // Nội dung bài đăng giới thiệu chi tiết
    description:   { type: String, default: null },
    // Đường dẫn các ảnh minh họa/chứng chỉ kèm theo bài đăng
    image_urls:    { type: [String], default: null },
    // PUBLISHED: đã đăng Draft: nháp, chưa đăng PENDING_MODERATION: bị (phụ huynh) báo cáo là có vấn đề HIDDEN: Ẩn…
    status:        { type: String, enum: Object.values(ENUMS.TutorPostsStatus), default: null },
  },
  {
    collection: 'TUTOR_POSTS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
tutorPostSchema.index({ status: 1, created_at: 1 });
tutorPostSchema.index({ profile_id: 1 });

export const TutorPost = mongoose.model('TutorPost', tutorPostSchema);
