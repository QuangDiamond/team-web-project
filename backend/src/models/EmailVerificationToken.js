// Token / OTP gửi qua email để xác thực tài khoản sau khi đăng ký; dùng 1 lần, có hạn (UC01, BR-03)
import mongoose from 'mongoose';
const { Schema } = mongoose;

const emailVerificationTokenSchema = new Schema(
  {
    // Khóa ngoại trỏ đến tài khoản người dùng cần được verify (Xác thực email, Reset mật khẩu...)
    user_id:     { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Giá trị chuỗi token hoặc mã OTP để Backend tiến hành so khớp và validate
    token_value: { type: String, required: true },
    // Mốc thời gian tuyệt đối mà token sẽ tự động hết hạn, chặn các request gửi mã quá hạn
    expired_at:  { type: Date, required: true },
    // Đánh dấu token đã dùng, chống dùng lại (BR-03)”
    is_used:     { type: Boolean, default: false },
  },
  {
    collection: 'EMAIL_VERIFICATION_TOKENS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
emailVerificationTokenSchema.index({ token_value: 1 }, { unique: true });
emailVerificationTokenSchema.index({ expired_at: 1 }, { expireAfterSeconds: 0 });

export const EmailVerificationToken = mongoose.model('EmailVerificationToken', emailVerificationTokenSchema);
