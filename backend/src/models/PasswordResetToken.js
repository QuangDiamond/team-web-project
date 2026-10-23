// & Reactivate Locked Account (do đăng nhập sai quá nhiều) Token đặt lại mật khẩu gửi qua email. Dùng
// cho 2 trường hợp: quên mật khẩu (UC03) và mở khóa tài khoản bị khóa do đăng nhập sai quá 5 lần …
import mongoose from 'mongoose';
const { Schema } = mongoose;

const passwordResetTokenSchema = new Schema(
  {
    user_id:     { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Lưu giá trị chuỗi token hoặc mã OTP để BE so khớp xem Client gửi lên có đúng khớp không
    token_value: { type: String, required: true },
    // Mốc thời gian token tự động hết hiệu lực, chặn không cho sử dụng mã cũ để reset password sau một khoảng thời…
    expired_at:  { type: Date, required: true },
    // - Chống Replay Attack: Đảm bảo mỗi token chỉ được dùng duy nhất 1 lần (BR-03). Dùng xong đánh dấu true. - Xử…
    is_used:     { type: Boolean, default: false },
  },
  {
    collection: 'PASSWORD_RESET_TOKENS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
passwordResetTokenSchema.index({ token_value: 1 }, { unique: true });
passwordResetTokenSchema.index({ expired_at: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
