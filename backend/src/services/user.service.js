import { User } from '../models/User.js';
import { AppError } from '../common/utils/AppError.js';

const ROLE_USE_WALLET = ['TUTOR', 'PARENT'];

export const getAll = async () => {
  try {
    const users = await User.find();
    return users;
  } catch (error) {
    return error;
  }
};

export const createUser = async (newUser, registerType = 'Regular') => {
  const isOAuth = registerType === 'OAuth2';
  // UC01 POST-1: đăng ký email/mật khẩu là UNVERIFIED đến khi bấm link; Google đã xác minh email nên ACTIVE
  let accountStatus = 'UNVERIFIED';
  if (isOAuth) {
    accountStatus = 'ACTIVE';
  }
  try {
    return await User.create({
      full_name: newUser.full_name,
      email: newUser.email,
      password_hash: newUser.password_hash,
      role: newUser.role,
      credit_wallet: ROLE_USE_WALLET.includes(newUser.role) ? {} : null,
      notification_preferences: {},
      google_account: isOAuth ? newUser.google_account : null,
      has_password: !isOAuth,
      email_verify_status: isOAuth,
      account_status: accountStatus,
      is_onboarded: isOAuth,
    });
  } catch (error) {
    if (error.code === 11000) throw new AppError('Email already existed', 409);
    throw error;
  }
};

export const updateUserLogin = async (userId) => {
  return User.findByIdAndUpdate(
    userId,
    // BR-02: đăng nhập thành công thì đếm lại số lần sai từ 0
    { last_login_at: new Date(), failed_login_attempts: 0 },
    { new: true, timestamps: false }
  ).select('-password_hash');
};
