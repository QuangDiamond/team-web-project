// Lịch sử biến động credit của gia sư: cấp hàng tháng, mua thêm, trừ khi mở chat, hoàn lại (UC20)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
const { Schema } = mongoose;

const creditTransactionSchema = new Schema(
  {
    // Chủ ví credit (gia sư hoặc phụ huynh). -> UC20 bước 2: lọc lịch sử biến động của đúng người đang xem
    user_id:               { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Số credit thay đổi: dương = cộng (nhận tháng, mua, hoàn), âm = trừ (ứng tuyển, gửi lời mời, hết hạn). -> UC20…
    amount:                { type: Schema.Types.Int32, required: true },
    // MONTHLY_GRANT = nhận định kỳ theo gói; PURCHASE = mua thêm qua credit pack; USED_APPLY = gia sư bị trừ khi ứng…
    type:                  { type: String, enum: Object.values(ENUMS.CreditTransactionsType), required: true },
    // Lượt ứng tuyển làm phát sinh giao dịch. Chỉ có giá trị khi type = USED_APPLY (hoặc REFUND của lượt ứng tuyển).…
    related_apply_id:      { type: Schema.Types.ObjectId, ref: 'ApplyRequest', default: null },
    // Lời mời làm phát sinh giao dịch. Chỉ có giá trị khi type = USED_INVITATION (hoặc REFUND của lời mời). -> UC20…
    related_invitation_id: { type: Schema.Types.ObjectId, ref: 'TutorInvitation', default: null },
    // Ngày hết hạn của credit được cộng. Credit tháng có hạn; credit mua từ pack để NULL (vĩnh viễn)
    expires_at:            { type: Date, default: null },
  },
  {
    collection: 'CREDIT_TRANSACTIONS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
creditTransactionSchema.index({ user_id: 1, created_at: 1 });

export const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);
