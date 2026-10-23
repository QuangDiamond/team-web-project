// Yêu cầu tìm gia sư do phụ huynh đăng (môn, lớp, mục tiêu, hình thức, lịch, ngân sách, yêu cầu với
// gia sư); gia sư xem và ứng tuyển (UC12, UC13, BR-05)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const decimalToString = (v) => (v == null ? v : v.toString());

const parentRequestSchema = new Schema(
  {
    // ID tài khoản phụ huynh tạo yêu cầu, tham chiếu trực tiếp đến bảng USERS thay vì profile
    parent_user_id:     { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Tiêu đề yêu cầu / chọn nhanh qua dropdown
    title:              { type: String, default: null },
    // Môn học cần tìm gia sư
    subject_name:       { type: String, default: null },
    // Khối lớp yêu cầu
    grade_level:        { type: String, default: null },
    // Hình thức học mong muốn
    teaching_mode:      { type: String, enum: Object.values(ENUMS.ParentRequestsTeachingMode), default: null },
    // Mức học phí dự kiến trả
    budget:             { type: Schema.Types.Decimal128, default: null, get: decimalToString },
    // Mô tả thời gian/lịch học rảnh của con
    schedule:           { type: String, default: null },
    // Mô tả chi tiết yêu cầu thêm
    description:        { type: String, default: null },
    // Địa điểm học, phục vụ lọc cứng vùng miền/khu vực
    location_address:   { type: String, default: null },
    // Ảnh hoặc tài liệu đính kèm yêu cầu nếu có
    image_urls:         { type: [String], default: null },
    // DRAFT- chưa đăng, nháp PENDING_MODERATION- người dùng report vi phạm OPEN - request đang mở IN_PROGRESS …
    status:             { type: String, enum: Object.values(ENUMS.ParentRequestsStatus), default: null },
    // Học sinh được gán cho bài đăng - Field 1 - optional
    student_id:         { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Yêu cầu riêng về gia sư (Giới tính, kinh nghiệm, trường học...)
    tutor_requirements: { type: String, default: null },
  },
  {
    collection: 'PARENT_REQUESTS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
parentRequestSchema.index({ status: 1, created_at: 1 });
parentRequestSchema.index({ parent_user_id: 1 });

export const ParentRequest = mongoose.model('ParentRequest', parentRequestSchema);
