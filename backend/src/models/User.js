// Tài khoản dùng chung cho mọi vai trò (Parent, Tutor, Student, Admin): thông tin đăng nhập, vai trò,
// trạng thái tài khoản và trạng thái khóa do đăng nhập sai (UC01–UC05, UC39)
import mongoose from 'mongoose';
import { ENUMS } from './enums.js';
import { googleAccountSchema } from './schemas/GoogleAccount.schema.js';
import { creditWalletSchema } from './schemas/CreditWallet.schema.js';
import { notificationPreferenceSchema } from './schemas/NotificationPreference.schema.js';
import { subscriptionSchema } from './schemas/Subscription.schema.js';
import { studentProfileSchema } from './schemas/StudentProfile.schema.js';
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    full_name:                { type: String, required: true },
    email:                    { type: String, required: true },
    password_hash:            { type: String, default: null },
    // Field này để lưu trạng thái xác thực email lúc nó đăng nhập nhé ae
    email_verify_status:      { type: Boolean, default: false },
    // Thay cho bảng ROLES + role_id: PARENT, STUDENT, TUTOR, ADMIN
    role:                     { type: String, enum: Object.values(ENUMS.UserRole), required: true },
    // Mục đích: Lưu lại xem tài khoản đăng nhập bằng Google đã khởi tạo xong thông tin cơ bản chưa. - Giá trị: +…
    is_onboarded:             { type: Boolean, default: false },
    // Trạng thái của tài khoản - ACTIVE, BANED, SUSPENDED. gồm 3 state này ACTIVE LÀ HOẠT ĐỘNG, SUSPENDED là bị đình…
    account_status:           { type: String, enum: Object.values(ENUMS.UserAccountStatus), default: 'ACTIVE' },
    // Số lần đăng nhập sai mk liên tiếp
    failed_login_attempts:    { type: Schema.Types.Int32, default: 0 },
    last_login_at:            { type: Date, default: null },
    // Xem có password ko (case đặt mk cho tài khoản đăng ký bằng google)
    has_password:             { type: Boolean, default: null },
    avatar_url:               { type: String, default: null },
    // state khóa do đăng nhập sai quá nhiều lần
    is_login_locked:          { type: Boolean, default: false },
    // EMBED từ bảng GOOGLE_ACCOUNTS: 1-1 với User; unique index trên google_account.google_id
    google_account:           { type: googleAccountSchema, default: null },
    // EMBED từ bảng USER_CREDITS: 1-1 với User; trừ/cộng bằng $inc nguyên tử trên credit_wallet.balance
    credit_wallet:            { type: creditWalletSchema, default: null },
    // EMBED từ bảng NOTIFICATION_PREFERENCES: 1-1 với User, luôn đọc khi gửi thông báo
    notification_preferences: { type: notificationPreferenceSchema, default: null },
    // EMBED từ bảng SUBSCRIPTIONS: gói hiện tại của người dùng (gia sư hoặc phụ huynh), 1-1 với User
    subscription:             { type: subscriptionSchema, default: null },
    // EMBED từ bảng STUDENTS: 1-1 với User (role STUDENT); quan hệ phụ huynh lấy từ PARENT_CHILD_LINKS
    student_profile:          { type: studentProfileSchema, default: null },
  },
  {
    collection: 'User',
    versionKey: false,
    strict: 'throw',
    autoIndex: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
  }
);

// Index khớp init_tuconnector.js (autoIndex tắt, index do script init tạo trên Atlas)
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'google_account.google_id': 1 }, { unique: true, partialFilterExpression: { 'google_account.google_id': { $type: 'string' } } });

export const User = mongoose.model('User', userSchema);
