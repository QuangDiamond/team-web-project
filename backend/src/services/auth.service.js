import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import {User} from '../models/User.js';
import { EmailVerificationToken } from '../models/EmailVerificationToken.js';
import * as userService from "../services/user.service.js"
import {AppError} from '../common/utils/AppError.js';
import { sendVerificationEmail } from '../common/utils/mailer.js';
import { env } from '../config/environment.js';


const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const GOOGLE_TICKET_EXPIRES_IN = '15m';
const GOOGLE_TICKET_TYPE = 'GOOGLE_REGISTER';

const oauthClient = new OAuth2Client(env.oauthClientId, env.oauthClientSecret, env.oauthRedirectUri);

const issueToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
};


const hashToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

const removePasswordHash = (user) => {
  const safeUser = user.toObject();
  delete safeUser.password_hash;
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
 * Đăng ký tài khoản mới, tài khoản chưa kích hoạt cho đến khi user bấm link trong email
 * @param {Object} data - { full_name, email, password, role }
 * @returns {Promise<Object>} user vừa tạo (không có password_hash)
 */
export const register = async ({ full_name, email, password, role }) => {
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new AppError('This email is already registered', 409);
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = { full_name, email, password_hash: hashed, role };
  const user = await userService.createUser(newUser, "Regular");

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
 * Đăng nhập bằng email + mật khẩu, chặn tài khoản chưa kích hoạt
 * @param {Object} userLogin - { email, password }
 * @returns {Promise<{ user: Object, token: string }>} user (không có password_hash) và JWT
 */
export const login = async (userLogin) =>{
    const {email, password} = userLogin;
    let user = await User.findOne({email: email}).select("+password_hash");

    // Tài khoản tạo bằng Google chưa có mật khẩu
    if(!user || !user.password_hash){
        throw new AppError("Invalid username or password", 401)
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
    if(!isPasswordCorrect){
        throw new AppError("Invalid username or password", 401)
    }
    if(!user.email_verify_status){
        throw new AppError("Account not verified", 403)
    }

    user = await userService.updateUserLogin(user._id);
    return {user: removePasswordHash(user), token: issueToken(user)};
}

/**
 * Lấy thông tin user đang đăng nhập
 * @param {string} userId - id lấy từ JWT
 * @returns {Promise<Object>} user (không có password_hash, has_password)
 */
export const me = async (userId) =>{
    const me = await User.findById(userId).select("-password_hash -has_password");
    if(!me) throw new AppError("User not found", 404);
    // const rs = {_id:me._id, email: me.email}
    return me;
}

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
 * @returns {Promise<{ user: Object, token: string } | { registerTicket: string }>}
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

  const googleAccount = { google_id: profile.sub, google_email: profile.email };

  // Đã liên kết Google trước đó: cập nhật lại google_email nếu user đổi Gmail
  let user = await User.findOne({ 'google_account.google_id': profile.sub });
  if (user) {
    if (user.google_account.google_email !== profile.email) {
      await User.findByIdAndUpdate(user._id, { google_account: googleAccount });
    }
  } else {
    // Email Google trùng tài khoản đăng ký thường: liên kết và kích hoạt luôn
    user = await User.findOne({ email: profile.email });
    if (user) {
      await User.findByIdAndUpdate(user._id, {
        google_account: googleAccount,
        email_verify_status: true,
      });
    }
  }

  if (user) {
    const loggedInUser = await userService.updateUserLogin(user._id);
    return { user: removePasswordHash(loggedInUser), token: issueToken(loggedInUser) };
  }

  const registerTicket = jwt.sign(
    {
      type: GOOGLE_TICKET_TYPE,
      google_id: profile.sub,
      google_email: profile.email,
      full_name: profile.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: GOOGLE_TICKET_EXPIRES_IN }
  );
  return { registerTicket };
};

/**
 * Hoàn tất đăng ký bằng Google (bước 2): tạo tài khoản đã kích hoạt với role user chọn
 * @param {Object} data - { ticket, full_name, role }
 * @returns {Promise<{ user: Object, token: string }>} user (không có password_hash) và JWT
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

  const existedUser = await User.findOne({
    $or: [
      { 'google_account.google_id': ticketData.google_id },
      { email: ticketData.google_email },
    ],
  });
  if (existedUser) {
    throw new AppError('This email is already registered', 409);
  }

  const newUser = {
    full_name: full_name,
    email: ticketData.google_email,
    password_hash: null,
    role: role,
    google_account: {
      google_id: ticketData.google_id,
      google_email: ticketData.google_email,
    },
  };
  const user = await userService.createUser(newUser, "OAuth2");
  return { user: removePasswordHash(user), token: issueToken(user) };
};
