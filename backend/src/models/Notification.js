// Thông báo trong ứng dụng gửi tới người dùng (kết nối, lời mời, lịch học, bài tập, kết quả...), có
// trạng thái đã đọc và trỏ tới đối tượng liên quan (UC35)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
import { notificationDeliveryLogSchema } from './schemas/NotificationDeliveryLog.schema.js';
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    // Người nhận thông báo
    recipient_user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    category:          { type: String, enum: Object.values(ENUMS.NotificationsCategory), default: null },
    // Tiêu đề thông báo
    title:             { type: String, default: null },
    // Nội dung chi tiết thông báo
    body:              { type: String, default: null },
    target_type:       { type: String, enum: Object.values(ENUMS.NotificationsTargetType), default: null },
    // ID đối tượng mục tiêu liên quan; đa hình (trỏ nhiều collection theo target_type) nên không có ref
    target_id:         { type: Schema.Types.ObjectId, default: null },
    // Trạng thái đã đọc (Default: FALSE)
    is_read:           { type: Boolean, default: false },
    // Timestamp đã đọc
    read_at:           { type: Date, default: null },
    // EMBED từ bảng NOTIFICATION_DELIVERY_LOGS: tối đa vài kênh (IN_APP/EMAIL/SMS) mỗi thông báo
    delivery_logs:     { type: [notificationDeliveryLogSchema], default: [] },
  },
  {
    collection: 'NOTIFICATIONS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
notificationSchema.index({ recipient_user_id: 1, is_read: 1, created_at: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
