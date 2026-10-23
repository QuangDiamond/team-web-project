// Phiên đăng nhập của người dùng, lưu refresh token theo từng thiết bị; dùng để cấp lại access token,
// đăng xuất và thu hồi phiên khi đổi mật khẩu / bị khóa (UC02–UC04, UC39)
import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSessionSchema = new Schema(
  {
    user_id:       { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Chuỗi Refresh Token dài hạn cấp cho Client. Dùng để đối soát dưới DB khi Access Token hết hạn. Nếu hợp lệ và…
    refresh_token: { type: String, required: true },
    // Trạng thái thu hồi Token. - Case Đăng xuất (Logout): Client xóa token ở bộ nhớ local, đồng thời gửi request…
    is_revoked:    { type: Boolean, default: false },
    // Thời gian hết hạn của Session. Do thông tin hết hạn nằm trong JWT của Client nên Server không thể tự động…
    expires_at:    { type: Date, required: true },
  },
  {
    collection: 'USER_SESSIONS',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
userSessionSchema.index({ refresh_token: 1 }, { unique: true });
userSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
userSessionSchema.index({ user_id: 1 });

export const UserSession = mongoose.model('UserSession', userSessionSchema);
