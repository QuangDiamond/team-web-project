// Đơn thanh toán của gia sư khi nâng cấp gói hoặc mua credit, gồm phương thức, trạng thái và chữ ký
// IPN từ cổng thanh toán (UC19, BR-10)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
import { receiptSchema } from './schemas/Receipt.schema.js';
const { Schema } = mongoose;

const decimalToString = (v) => (v == null ? v : v.toString());

const paymentOrderSchema = new Schema(
  {
    // Mã đơn hàng VietQR/IPN
    order_code:      { type: String, default: null },
    // Người tạo đơn hàng
    user_id:         { type: Schema.Types.ObjectId, ref: 'User', default: null },
    item_type:       { type: String, enum: Object.values(ENUMS.PaymentOrdersItemType), default: null },
    // Gói cước mục tiêu
    plan_id:         { type: Schema.Types.ObjectId, ref: 'Plan', default: null },
    // Gói credit mục tiêu
    pack_id:         { type: Schema.Types.ObjectId, ref: 'CreditPack', default: null },
    // Số lượng credit pack mua trong đơn (chỉ dùng khi item_type = CREDIT_PACK). amount = CREDIT_PACKS.price ×…
    quantity:        { type: Schema.Types.Int32, default: 1 },
    // Số tháng mua gói (chỉ dùng khi item_type = PLAN_UPGRADE, vd 1/3/6/12). amount = PLANS.monthly_price ×…
    duration_months: { type: Schema.Types.Int32, default: null },
    // Tổng tiền thanh toán (VND)
    amount:          { type: Schema.Types.Decimal128, default: null, get: decimalToString },
    payment_method:  { type: String, enum: Object.values(ENUMS.PaymentOrdersPaymentMethod), default: null },
    // EXPIRED - hết hạn sau 15 tạo (BR-10) PENDING - đang chờ SUCCESS, - thành công FAILED, - fail CANCELLED - hủy
    status:          { type: String, enum: Object.values(ENUMS.PaymentOrdersStatus), default: null },
    // Chữ ký xác thực IPN
    ipn_signature:   { type: String, default: null },
    // Timestamp hoàn tất thanh toán
    paid_at:         { type: Date, default: null },
    // EMBED từ bảng RECEIPTS: 1-1 với đơn hàng
    receipt:         { type: receiptSchema, default: null },
  },
  {
    collection: 'PAYMENT_ORDERS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
paymentOrderSchema.index({ order_code: 1 }, { unique: true, partialFilterExpression: { order_code: { $type: 'string' } } });
paymentOrderSchema.index({ user_id: 1, created_at: -1 });

export const PaymentOrder = mongoose.model('PaymentOrder', paymentOrderSchema);
