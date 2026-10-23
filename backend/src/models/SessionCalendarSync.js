// Trạng thái đồng bộ từng buổi học lên Google Calendar của từng người (event ID, lỗi gần nhất), dùng
// để cập nhật / xóa event khi lịch đổi (UC28, UC30, UC31)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const sessionCalendarSyncSchema = new Schema(
  {
    // Synced session
    session_id:      { type: Schema.Types.ObjectId, ref: 'ClassSession', default: null },
    // Target user
    user_id:         { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // ID sự kiện Google Calendar
    google_event_id: { type: String, default: null },
    sync_status:     { type: String, enum: Object.values(ENUMS.SessionCalendarSyncSyncStatus), default: null },
    // Thông báo lỗi đồng bộ
    last_error:      { type: String, default: null },
    // Timestamp sync
    synced_at:       { type: Date, default: null },
  },
  {
    collection: 'SESSION_CALENDAR_SYNC',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    toJSON: { getters: true },
  }
);

export const SessionCalendarSync = mongoose.model('SessionCalendarSync', sessionCalendarSyncSchema);
