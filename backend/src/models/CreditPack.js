// Danh mục gói mua thêm credit (số credit, giá). Admin cấu hình (UC19, UC41)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const decimalToString = (v) => (v == null ? v : v.toString());

const creditPackSchema = new Schema(
  {
    // Gói credit dành cho vai trò nào; null = bán cho cả gia sư và phụ huynh
    target_role:   { type: String, enum: Object.values(ENUMS.PlanTargetRole), default: null },
    // Tên gói credit
    name:          { type: String, default: null },
    // Số lượng credit trong gói
    credit_amount: { type: Schema.Types.Int32, default: null },
    // Giá bán gói credit (VND)
    price:         { type: Schema.Types.Decimal128, default: null, get: decimalToString },
    // Trạng thái mở bán
    is_active:     { type: Boolean, default: null },
  },
  {
    collection: 'CREDIT_PACKS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    toJSON: { getters: true },
  }
);

export const CreditPack = mongoose.model('CreditPack', creditPackSchema);
