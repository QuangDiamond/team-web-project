// Danh mục gói dịch vụ (Free, Pro): giá, credit hàng tháng, AI quota, nhắc lịch SMS, số lớp tối đa.
// Admin cấu hình (UC41)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const decimalToString = (v) => (v == null ? v : v.toString());

const planSchema = new Schema(
  {
    // Gói dành cho vai trò nào: TUTOR hoặc PARENT. Người dùng chỉ đăng ký được gói đúng vai trò của mình. Gói PARENT…
    target_role:           { type: String, enum: Object.values(ENUMS.PlanTargetRole), required: true },
    // FREE_DEFAULT, PRO
    name:                  { type: String, default: null },
    // Giá cước hàng tháng
    monthly_price:         { type: Schema.Types.Decimal128, default: null, get: decimalToString },
    // Số credit cấp hàng tháng
    monthly_credits:       { type: Schema.Types.Int32, default: null },
    // Giới hạn AI hàng tháng
    ai_quota:              { type: Schema.Types.Int32, default: null },
    // Cờ tính năng SMS
    sms_reminders_enabled: { type: Boolean, default: null },
    // Trạng thái khả dụng
    is_active:             { type: Boolean, default: null },
    max_classrooms:        { type: Schema.Types.Int32, default: null },
  },
  {
    collection: 'PLANS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    toJSON: { getters: true },
  }
);

export const Plan = mongoose.model('Plan', planSchema);
