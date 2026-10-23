// Subdocument nhúng trong User.notification_preferences (object). Bảng gốc: NOTIFICATION_PREFERENCES.
// Lý do embed: 1-1 với User, luôn đọc khi gửi thông báo
import mongoose from 'mongoose';
const { Schema } = mongoose;

export const notificationPreferenceSchema = new Schema(
  {
    // Bật/Tắt thông báo In-app (Default: TRUE)
    enable_in_app:         { type: Boolean, default: true },
    // Bật/Tắt thông báo qua Email (Default: TRUE)
    enable_email:          { type: Boolean, default: true },
    // Bật/Tắt thông báo qua SMS (Default: FALSE)
    enable_sms:            { type: Boolean, default: false },
    // Cấu hình thông báo Lịch học & Đổi lịch
    notify_on_sessions:    { type: Boolean, default: null },
    // Cấu hình thông báo Bài tập & Điểm số
    notify_on_assignments: { type: Boolean, default: null },
    // Cấu hình thông báo Tin nhắn Chat
    notify_on_messages:    { type: Boolean, default: null },
    // Timestamp cập nhật cài đặt
    updated_at:            { type: Date, default: null },
  },
  { _id: false }
);
