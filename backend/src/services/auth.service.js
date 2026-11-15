import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { EmailVerificationToken } from '../models/EmailVerificationToken.js';
import { UserSession } from '../models/UserSession.js';
import * as userService from '../services/user.service.js';
import { AppError } from '../common/utils/AppError.js';
import { sendVerificationEmail } from '../common/utils/mailer.js';
import { env } from '../config/environment.js';
import { ACCOUNT_LOCKED_MESSAGE } from '../common/middlewares/auth.middleware.js';
import { issueToken, createSession, hashRefreshToken, isRememberToken } from '../common/utils/authSession.js';

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const GOOGLE_TICKET_EXPIRES_IN = '15m';
const GOOGLE_TICKET_TYPE = 'GOOGLE_REGISTER';
// BR-02: sai mật khẩu 5 lần liên tiếp thì khóa đăng nhập cho đến khi đặt lại mật khẩu
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
// Đăng nhập Google không có ô "Remember me" nên luôn giữ phiên 7 ngày như trước đây
const GOOGLE_REMEMBER_ME = true;

export const INVALID_CREDENTIALS_MESSAGE = 'Email or password is incorrect';
export const LOGIN_LOCKED_MESSAGE = 'Your account is locked after too many failed login attempts. Please reset your password via Forgot Password';
export const NOT_VERIFIED_MESSAGE = 'Account not verified';
const INVALID_REFRESH_MESSAGE = 'Invalid or expired refresh token';

const oauthClient = new OAuth2Client(env.oauthClientId, env.oauthClientSecret, env.oauthRedirectUri);

const hashToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

const removePasswordHash = (user) => {
  const safeUser = user.toObject ? user.toObject() : { ...user };
  safeUser.id = String(user._id || user.id);
  delete safeUser.password_hash;
  delete safeUser.password;
  return safeUser;
};

/**
 * Hồ sơ gia sư mới tạo là bản nháp rỗng, gia sư tự hoàn thiện ở UC05 (không điền headline/bio giả)
 * @param {Object} user - user role TUTOR
 * @returns {Promise<void>}
 */
const createDraftTutorProfile = async (user) => {
  await TutorProfile.findOneAndUpdate(
    { user_id: user._id },
    { $setOnInsert: { user_id: user._id, is_complete: false } },
    { upsert: true, new: true }
  );
};

/**
 * Hồ sơ gia sư đã hoàn thiện chưa, để frontend chuyển gia sư sang trang hồ sơ (UC01-A2 / UC05)
 * @param {Object} user - user đang đăng nhập
 * @returns {Promise<boolean|null>} null nếu không phải gia sư
 */
const getTutorProfileComplete = async (user) => {
  if (user.role !== 'TUTOR') {
    return null;
  }
  const profile = await TutorProfile.findOne({ user_id: user._id }).select('is_complete');
  if (!profile) {
    return false;
  }
  return profile.is_complete === true;
};

/**
 * Trả user cho client kèm cờ tutor_profile_complete
 * @param {Object} user - user (có thể còn password_hash)
 * @returns {Promise<Object>} user không có password_hash
 */
const toAuthUser = async (user) => {
  const safeUser = removePasswordHash(user);
  safeUser.tutor_profile_complete = await getTutorProfileComplete(user);
  return safeUser;
};

/**
 * Tạo token kích hoạt mới (xóa token cũ của user) và gửi link kích hoạt qua email
 * @param {Object} user - user cần kích hoạt
 * @returns {Promise<void>}
 */
const createAndSendVerification = async (user) => {
  await EmailVerificationToken.deleteMany({ user_id: user._id });

  const rawToken = crypto.randomBytes(32).toString('hex');
  await EmailVerificationToken.create({
    user_id: user._id,
    token_value: hashToken(rawToken),
    expired_at: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  });

  const verifyLink = `${env.apiUrl}/auth/v1/verify-email?token=${rawToken}`;
  await sendVerificationEmail(user.email, user.full_name, verifyLink);
};

/**
 * Đăng ký tài khoản mới ở trạng thái UNVERIFIED cho đến khi user bấm link trong email (UC01 POST-1)
 * @param {Object} data - { full_name, email, password, role }, email đã chuẩn hóa chữ thường ở validator
 * @returns {Promise<Object>} user vừa tạo (không có password_hash)
 */
export const register = async ({ full_name, email, password, role }) => {
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new AppError('This email is already registered', 409);
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = { full_name, email, password_hash: hashed, role };
  const user = await userService.createUser(newUser, 'Regular');

  if (user.role === 'TUTOR') {
    await createDraftTutorProfile(user);
  }

  // Gửi mail lỗi vẫn giữ tài khoản, user có thể bấm "Resend verification email"
  try {
    await createAndSendVerification(user);
  } catch (error) {
    console.error('Send verification email failed:', error);
  }

  return removePasswordHash(user);
};

/**
 * Kích hoạt tài khoản từ link trong email
 * @param {string} rawToken - token trong query của link
 * @returns {Promise<boolean>} true nếu kích hoạt thành công, false nếu link sai hoặc hết hạn
 */
export const verifyEmail = async (rawToken) => {
  if (typeof rawToken !== 'string' || rawToken.length === 0) {
    return false;
  }

  const verifyToken = await EmailVerificationToken.findOne({
    token_value: hashToken(rawToken),
    expired_at: { $gt: new Date() },
  });
  if (!verifyToken) {
    return false;
  }

  await User.findByIdAndUpdate(verifyToken.user_id, { email_verify_status: true });
  // Chỉ chuyển UNVERIFIED -> ACTIVE, không mở khóa tài khoản Admin đã SUSPENDED / BANNED
  await User.updateOne({ _id: verifyToken.user_id, account_status: 'UNVERIFIED' }, { $set: { account_status: 'ACTIVE' } });
  await EmailVerificationToken.deleteMany({ user_id: verifyToken.user_id });
  return true;
};

/**
 * Gửi lại email kích hoạt. Không báo lỗi khi email không tồn tại / đã kích hoạt / gửi quá nhanh,
 * để không lộ email nào đã đăng ký
 * @param {string} email - email cần gửi lại
 * @returns {Promise<void>}
 */
export const resendVerification = async (email) => {
  const user = await User.findOne({ email });
  if (!user || user.email_verify_status) {
    return;
  }

  const lastToken = await EmailVerificationToken.findOne({ user_id: user._id }).sort({ expired_at: -1 });
  if (lastToken) {
    const lastSentAt = lastToken.expired_at.getTime() - VERIFY_TOKEN_TTL_MS;
    if (Date.now() - lastSentAt < RESEND_COOLDOWN_MS) {
      return;
    }
  }

  try {
    await createAndSendVerification(user);
  } catch (error) {
    console.error('Resend verification email failed:', error);
  }
};

/**
 * Đăng nhập bằng email + mật khẩu (UC02): khóa sau 5 lần sai (BR-02), tạo phiên refresh token
 * @param {Object} userLogin - { email, password, remember_me }, email đã chuẩn hóa chữ thường ở validator
 * @returns {Promise<{ user: Object, token: string, refreshToken: string }>} user (không có password_hash),
 * access JWT và refresh token gốc
 */
export const login = async ({ email, password, remember_me }) => {
  const user = await User.findOne({ email: email }).select('+password_hash');

  // Tài khoản tạo bằng Google chưa có mật khẩu
  if (!user || !user.password_hash) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
  }
  // BR-02: đã khóa thì từ chối kể cả khi đúng mật khẩu, chỉ mở lại bằng Forgot Password
  if (user.is_login_locked) {
    throw new AppError(LOGIN_LOCKED_MESSAGE, 403);
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordCorrect) {
    // $inc nguyên tử để nhiều request sai cùng lúc vẫn đếm đủ
    const failedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $inc: { failed_login_attempts: 1 } },
      { new: true, timestamps: false }
    );
    if (failedUser && failedUser.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      await User.updateOne({ _id: user._id }, { $set: { is_login_locked: true } }, { timestamps: false });
      throw new AppError(LOGIN_LOCKED_MESSAGE, 403);
    }
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
  }

  // Kiểm tra sau khi đúng mật khẩu để không lộ trạng thái tài khoản (UC37, D18).
  // Tài khoản cũ (trước khi có UNVERIFIED) có thể ACTIVE nhưng chưa xác minh email
  if (user.account_status === 'UNVERIFIED' || !user.email_verify_status) {
    throw new AppError(NOT_VERIFIED_MESSAGE, 403);
  }
  if (user.account_status !== 'ACTIVE') {
    throw new AppError(ACCOUNT_LOCKED_MESSAGE, 403);
  }

  // Tutor cũ chưa có hồ sơ thì tạo bản nháp
  if (user.role === 'TUTOR') {
    await createDraftTutorProfile(user);
  }

  const passwordHash = user.password_hash;
  const loggedInUser = await userService.updateUserLogin(user._id);
  const refreshToken = await createSession(user._id, remember_me === true);
  return {
    user: await toAuthUser(loggedInUser),
    token: issueToken(loggedInUser, passwordHash),
    refreshToken: refreshToken,
  };
};

/**
 * Cấp lại access token từ refresh token (UC02-6). Xoay vòng: thu hồi phiên cũ, tạo phiên mới
 * @param {string} rawRefreshToken - refresh token trong cookie
 * @returns {Promise<{ token: string, refreshToken: string, remember: boolean }>} access JWT, refresh token mới
 * và lựa chọn "Remember me" của phiên cũ
 */
export const refreshSession = async (rawRefreshToken) => {
  if (typeof rawRefreshToken !== 'string' || rawRefreshToken.length === 0) {
    throw new AppError(INVALID_REFRESH_MESSAGE, 401);
  }

  // Thu hồi nguyên tử: 2 request cùng dùng 1 refresh token thì chỉ 1 request thành công
  const session = await UserSession.findOneAndUpdate(
    { refresh_token: hashRefreshToken(rawRefreshToken), is_revoked: false, expires_at: { $gt: new Date() } },
    { $set: { is_revoked: true } },
    { new: true }
  );
  if (!session) {
    throw new AppError(INVALID_REFRESH_MESSAGE, 401);
  }

  const user = await User.findById(session.user_id).select('+password_hash');
  if (!user) {
    throw new AppError(INVALID_REFRESH_MESSAGE, 401);
  }
  if (user.account_status !== 'ACTIVE') {
    throw new AppError(ACCOUNT_LOCKED_MESSAGE, 403);
  }

  const remember = isRememberToken(rawRefreshToken);
  const refreshToken = await createSession(user._id, remember);
  return { token: issueToken(user), refreshToken: refreshToken, remember: remember };
};

/**
 * Lấy thông tin user đang đăng nhập
 * @param {string} userId - id lấy từ JWT
 * @returns {Promise<Object>} Safe user without password_hash, with derived has_password boolean
 * and tutor_profile_complete
 */
export const me = async (userId) => {
  const me = await User.findById(userId).select('+password_hash');
  if (!me) throw new AppError('User not found', 404);
  const safeUser = await toAuthUser(me);
  safeUser.has_password = Boolean(me.password_hash);
  return safeUser;
};

/**
 * Tạo URL chuyển hướng sang trang đồng ý của Google
 * @param {string} state - chuỗi ngẫu nhiên chống CSRF, cũng được lưu trong cookie
 * @returns {string} URL của Google
 */
export const getGoogleAuthUrl = (state) => {
  return oauthClient.generateAuthUrl({
    scope: ['openid', 'email', 'profile'],
    state: state,
    prompt: 'select_account',
  });
};

/**
 * Xử lý callback của Google: đăng nhập nếu đã có tài khoản (liên kết theo email nếu cần),
 * nếu chưa có thì tạo ticket để user hoàn tất đăng ký ở bước 2
 * @param {string} code - authorization code Google trả về
 * @returns {Promise<{ user: Object, token: string, refreshToken: string } | { registerTicket: string }>}
 */
export const handleGoogleCallback = async (code) => {
  const { tokens } = await oauthClient.getToken(code);
  const loginTicket = await oauthClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.oauthClientId,
  });
  const profile = loginTicket.getPayload();
  if (!profile.email_verified) {
    throw new AppError('Google email is not verified', 401);
  }

  // UC01-2: email không phân biệt hoa thường
  const googleEmail = profile.email.trim().toLowerCase();
  const googleAccount = { google_id: profile.sub, google_email: googleEmail };

  // Đã liên kết Google trước đó: cập nhật lại google_email nếu user đổi Gmail
  let user = await User.findOne({ 'google_account.google_id': profile.sub });
  if (user) {
    if (user.google_account.google_email !== googleEmail) {
      await User.findByIdAndUpdate(user._id, { google_account: googleAccount });
    }
  } else {
    // Email Google trùng tài khoản đăng ký thường: liên kết và kích hoạt luôn
    user = await User.findOne({ email: googleEmail });
    if (user) {
      const linkUpdate = { google_account: googleAccount, email_verify_status: true };
      // Google đã xác minh email nên tài khoản UNVERIFIED được kích hoạt luôn
      if (user.account_status === 'UNVERIFIED') {
        linkUpdate.account_status = 'ACTIVE';
        user.account_status = 'ACTIVE';
      }
      await User.findByIdAndUpdate(user._id, linkUpdate);
    }
  }

  if (user) {
    if (user.account_status !== 'ACTIVE') {
      throw new AppError(ACCOUNT_LOCKED_MESSAGE, 403);
    }
    if (user.role === 'TUTOR') {
      await createDraftTutorProfile(user);
    }
    const loggedInUser = await userService.updateUserLogin(user._id);
    const refreshToken = await createSession(user._id, GOOGLE_REMEMBER_ME);
    return {
      user: await toAuthUser(loggedInUser),
      token: issueToken(loggedInUser, user.password_hash),
      refreshToken: refreshToken,
    };
  }

  const registerTicket = jwt.sign(
    {
      type: GOOGLE_TICKET_TYPE,
      google_id: profile.sub,
      google_email: googleEmail,
      full_name: profile.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: GOOGLE_TICKET_EXPIRES_IN }
  );
  return { registerTicket };
};

/**
 * Hoàn tất đăng ký bằng Google (bước 2): tạo tài khoản ACTIVE với role user chọn
 * @param {Object} data - { ticket, full_name, role }
 * @returns {Promise<{ user: Object, token: string, refreshToken: string }>} user (không có password_hash),
 * access JWT và refresh token gốc
 */
export const completeGoogleRegister = async ({ ticket, full_name, role }) => {
  let ticketData;
  try {
    ticketData = jwt.verify(ticket, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Ticket invalid or expired', 401);
  }
  if (ticketData.type !== GOOGLE_TICKET_TYPE) {
    throw new AppError('Ticket invalid or expired', 401);
  }

  const googleEmail = ticketData.google_email.toLowerCase();
  const existedUser = await User.findOne({
    $or: [{ 'google_account.google_id': ticketData.google_id }, { email: googleEmail }],
  });
  if (existedUser) {
    throw new AppError('This email is already registered', 409);
  }

  const newUser = {
    full_name: full_name,
    email: googleEmail,
    password_hash: null,
    role: role,
    google_account: {
      google_id: ticketData.google_id,
      google_email: googleEmail,
    },
  };
  const user = await userService.createUser(newUser, 'OAuth2');

  if (user.role === 'TUTOR') {
    await createDraftTutorProfile(user);
  }

  const refreshToken = await createSession(user._id, GOOGLE_REMEMBER_ME);
  return { user: await toAuthUser(user), token: issueToken(user), refreshToken: refreshToken };
};
