// Subdocument nhúng trong User.google_account (object). Bảng gốc: GOOGLE_ACCOUNTS. Lý do embed: 1-1
// với User; unique index trên google_account.google_id
import mongoose from 'mongoose';
const { Schema } = mongoose;

export const googleAccountSchema = new Schema(
  {
    // ID định danh vĩnh viễn của tài khoản Google (sub). Unique index trên User.google_account.google_id
    google_id:    { type: String, required: true },
    // Lưu xem nó đăng nhập bằng tài khoản Google gì, email cụ thể là gì để phục vụ việc hiển thị và đối soát xác…
    google_email: { type: String, required: true },
  },
  { _id: false }
);
