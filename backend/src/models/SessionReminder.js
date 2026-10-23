// Lịch nhắc buổi học gửi tới từng người qua email / SMS (24 giờ và 30 phút trước buổi học), kèm trạng
// thái gửi (UC28, BR-14)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const sessionReminderSchema = new Schema(
  {
    // Target session
    session_id:    { type: Schema.Types.ObjectId, ref: 'ClassSession', default: null },
    // Recipient user
    user_id:       { type: Schema.Types.ObjectId, ref: 'User', default: null },
    channel:       { type: String, enum: Object.values(ENUMS.SessionRemindersChannel), default: null },
    // BEFORE_24H, BEFORE_30M
    trigger_time:  { type: String, enum: Object.values(ENUMS.SessionRemindersTriggerTime), default: null },
    // Giờ lên lịch gửi tin
    scheduled_for: { type: Date, default: null },
    // PENDING, - chờ, chưa gửi SENT, - đã gửi FAILED
    status:        { type: String, enum: Object.values(ENUMS.SessionRemindersStatus), default: null },
    // Timestamp phát tin
    sent_at:       { type: Date, default: null },
  },
  {
    collection: 'SESSION_REMINDERS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
sessionReminderSchema.index({ status: 1, scheduled_for: 1 });

export const SessionReminder = mongoose.model('SessionReminder', sessionReminderSchema);
