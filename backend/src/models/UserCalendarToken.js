// Token OAuth kết nối Google Calendar của người dùng để đồng bộ lịch học. 1-1 với User (UC31)
import mongoose from 'mongoose';
const { Schema } = mongoose;

const userCalendarTokenSchema = new Schema(
  {
    // User account
    user_id:            { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // GOOGLE_CALENDAR
    provider:           { type: String, default: null },
    // OAuth Access Token (Encrypted)
    access_token:       { type: String, default: null },
    // OAuth Refresh Token (Encrypted)
    refresh_token:      { type: String, default: null },
    // Mã Google Calendar "TuConnector"
    google_calendar_id: { type: String, default: null },
    // Trạng thái kết nối
    is_connected:       { type: Boolean, default: null },
    // Timestamp đồng bộ gần nhất
    last_synced_at:     { type: Date, default: null },
    // Timestamp hết hạn Token
    expires_at:         { type: Date, default: null },
  },
  {
    collection: 'USER_CALENDAR_TOKENS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
userCalendarTokenSchema.index({ user_id: 1 }, { unique: true, partialFilterExpression: { user_id: { $type: 'objectId' } } });

export const UserCalendarToken = mongoose.model('UserCalendarToken', userCalendarTokenSchema);
