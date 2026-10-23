// Subdocument nhúng trong User.subscription (object). Bảng gốc: SUBSCRIPTIONS. Chỉ lưu gói hiện tại
// của người dùng (gia sư hoặc phụ huynh); lịch sử mua gói xem ở PAYMENT_ORDERS
import mongoose from 'mongoose';
import { ENUMS } from '../enums.js';
const { Schema } = mongoose;

export const subscriptionSchema = new Schema(
  {
    // Gói cước hiện tại
    plan_id:           { type: Schema.Types.ObjectId, ref: 'Plan', default: null },
    // ACTIVE - còn hạn EXPIRED, - đã hết hạn
    status:            { type: String, enum: Object.values(ENUMS.SubscriptionsStatus), default: null },
    // Ngày hết hạn gói (A1)
    expires_at:        { type: Date, default: null },
    // Số lượt AI đã xài
    ai_quota_used:     { type: Schema.Types.Int32, default: null },
    // Mốc thời gian reset AI
    ai_quota_reset_at: { type: Date, default: null },
    // Ngày bắt đầu gói
    start_date:        { type: Date, default: null },
    // Timestamp tạo subscription
    created_at:        { type: Date, default: null },
  },
  { _id: false }
);
