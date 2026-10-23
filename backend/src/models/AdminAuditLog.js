// Nhật ký mọi hành động của Admin (khóa tài khoản, xử lý nội dung, đổi cấu hình) kèm lý do và chi tiết
// để truy vết (BR-20, UC39–UC41)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const adminAuditLogSchema = new Schema(
  {
    // Admin thực hiện kiểm duyệt
    admin_user_id:  { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Tài khoản vi phạm bị tác động
    target_user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action:         { type: String, enum: Object.values(ENUMS.AdminAuditLogsAction), default: null },
    // Lý do và ghi chú xử lý
    reason:         { type: String, default: null },
    // Chi tiết nội dung vi phạm
    details_json:   { type: Schema.Types.Mixed, default: null },
    // Địa chỉ IP của Admin
    ip_address:     { type: String, default: null },
  },
  {
    collection: 'ADMIN_AUDIT_LOGS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { getters: true },
  }
);

export const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);
