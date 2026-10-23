// Subdocument nhúng trong PAYMENT_ORDERS.receipt (object). Bảng gốc: RECEIPTS. Lý do embed: 1-1 với
// đơn hàng
import mongoose from 'mongoose';
const { Schema } = mongoose;

export const receiptSchema = new Schema(
  {
    // Đường dẫn URL biên lai (PDF/Image)
    receipt_url: { type: String, default: null },
    // Timestamp xuất biên lai
    created_at:  { type: Date, default: null },
  },
  { _id: false }
);
