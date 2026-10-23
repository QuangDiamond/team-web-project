// Subdocument nhúng trong NOTIFICATIONS.delivery_logs (mảng). Bảng gốc: NOTIFICATION_DELIVERY_LOGS. Lý
// do embed: tối đa vài kênh (IN_APP/EMAIL/SMS) mỗi thông báo
import mongoose from 'mongoose';
import { ENUMS } from '../enums.js';
const { Schema } = mongoose;

export const notificationDeliveryLogSchema = new Schema(
  {
    // Người nhận
    recipient_user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    channel:           { type: String, enum: Object.values(ENUMS.NotificationDeliveryLogsChannel), default: null },
    status:            { type: String, enum: Object.values(ENUMS.NotificationDeliveryLogsStatus), default: null },
    // Thông báo lỗi gửi tin
    error_message:     { type: String, default: null },
    // Timestamp phát tin
    dispatched_at:     { type: Date, default: null },
  },
  { _id: false }
);
