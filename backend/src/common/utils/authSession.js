import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { UserSession } from '../../models/UserSession.js';

// SDS UC02: access token 30 phút, refresh token (phiên) 7 ngày
export const ACCESS_TOKEN_TTL_MS = 30 * 60 * 1000;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Tiền tố của refresh token cho biết user có chọn "Remember me" không (UC02-7).
// Cả chuỗi được hash khi lưu nên client sửa tiền tố thì không còn khớp phiên nào
const REMEMBER_PREFIX = 'r.';
const SESSION_PREFIX = 's.';

export const passwordVersion = (passwordHash) => {
  return createHash('sha256').update(passwordHash || '').digest('hex');
};

export const hashRefreshToken = (rawToken) => {
  return createHash('sha256').update(rawToken).digest('hex');
};

export const isRememberToken = (rawToken) => {
  if (typeof rawToken !== 'string') {
    return false;
  }
  return rawToken.startsWith(REMEMBER_PREFIX);
};

export const issueToken = (user, passwordHash = user.password_hash) => {
  return jwt.sign(
    { sub: String(user._id || user.id), role: user.role, password_version: passwordVersion(passwordHash) },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL_MS / 1000 }
  );
};

/**
 * Tạo phiên đăng nhập mới: sinh refresh token ngẫu nhiên, chỉ lưu sha256 của nó vào USER_SESSIONS
 * @param {string} userId - id user
 * @param {boolean} remember - user có chọn "Remember me" không
 * @returns {Promise<string>} refresh token gốc (chỉ gửi cho client qua cookie)
 */
export const createSession = async (userId, remember) => {
  let prefix = SESSION_PREFIX;
  if (remember) {
    prefix = REMEMBER_PREFIX;
  }
  const refreshToken = prefix + randomBytes(32).toString('hex');
  await UserSession.create({
    user_id: userId,
    refresh_token: hashRefreshToken(refreshToken),
    is_revoked: false,
    expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return refreshToken;
};
