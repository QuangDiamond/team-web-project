// Subdocument nhúng trong User.credit_wallet (object). Bảng gốc: USER_CREDITS. Lý do embed: 1-1 với
// User; trừ/cộng bằng $inc nguyên tử trên credit_wallet.balance
import mongoose from 'mongoose';
const { Schema } = mongoose;

export const creditWalletSchema = new Schema(
  {
    // Deducted by 1 on apply (POST-1, E1)
    balance:    { type: Schema.Types.Int32, default: 20 },
  },
  { _id: false, timestamps: { createdAt: false, updatedAt: 'updated_at' }}
);
