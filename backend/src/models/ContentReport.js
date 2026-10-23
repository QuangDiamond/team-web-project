// Báo cáo vi phạm dùng chung cho mọi loại nội dung (bài đăng, yêu cầu, đánh giá, tin nhắn, người dùng,
// lớp học), do người dùng gửi hoặc hệ thống tự flag, kèm kết quả xử lý của Admin (UC34 A3, UC40, …
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const contentReportSchema = new Schema(
  {
    // Người gửi báo cáo (FK → User)
    reporter_user_id:     { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Loại đối tượng bị báo cáo: POST, REQUEST, REVIEW, MESSAGE, USER, CLASSROOM. Báo cáo tin nhắn (UC34 A3) dùng…
    target_type:          { type: String, enum: Object.values(ENUMS.ContentReportsTargetType), default: null },
    // ID của đối tượng bị báo cáo, ứng với target_type (VD: target_type = MESSAGE thì target_id = message_id). Không…; đa hình (trỏ nhiều collection theo target_type) nên không có ref
    target_id:            { type: Schema.Types.ObjectId, default: null },
    // Lý do báo cáo do người dùng nhập hoặc lý do hệ thống gắn khi tự flag (VD: "Chứa số điện thoại", "Ngôn từ xúc…
    reason:               { type: String, default: null },
    // Mức độ nghiêm trọng: LOW, MEDIUM, HIGH, CRITICAL. Dùng để sắp xếp hàng chờ cho Admin xử lý (UC40 bước 1: liệt…
    severity:             { type: String, enum: Object.values(ENUMS.ContentReportsSeverity), default: null },
    // Trạng thái xử lý: PENDING (mới tạo) → INVESTIGATING (Admin đang xem) → RESOLVED (đã xử lý) hoặc DISMISSED (báo…
    status:               { type: String, enum: Object.values(ENUMS.ContentReportsStatus), default: null },
    // Hành động Admin đã thực hiện: NONE, WARNING_SENT, CONTENT_HIDDEN, CONTENT_REMOVED, USER_BANNED. NULL khi chưa…
    action_taken:         { type: String, enum: Object.values(ENUMS.ContentReportsActionTaken), default: null },
    // Ghi chú / lý do của Admin khi xử lý. Bắt buộc nhập khi xử lý theo BR-20 (mọi hành động của Admin phải có lý…
    admin_note:           { type: String, default: null },
    // Admin đã xử lý báo cáo (FK → User, Nullable). Dùng để truy vết ai xử lý, kết hợp với ADMIN_AUDIT_LOGS
    resolved_by_admin_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Thời điểm báo cáo được xử lý xong (RESOLVED hoặc DISMISSED). NULL khi chưa xử lý
    resolved_at:          { type: Date, default: null },
  },
  {
    collection: 'CONTENT_REPORTS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
contentReportSchema.index({ status: 1, severity: 1 });
contentReportSchema.index({ target_type: 1, target_id: 1 });

export const ContentReport = mongoose.model('ContentReport', contentReportSchema);
