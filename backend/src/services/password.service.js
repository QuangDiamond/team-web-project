import { createHash, randomBytes } from 'node:crypto';
import { setImmediate } from 'node:timers';
import { URL } from 'node:url';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { AppError } from '../common/utils/AppError.js';
import { issueToken, passwordVersion } from '../common/utils/authSession.js';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../common/utils/mailer.js';
import { env } from '../config/environment.js';

const RESET_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const INVALID_LINK = 'The link is invalid or expired';

/**
 * Rotate one per-user recovery record and deliver the link outside the HTTP response.
 * @param {string} email - Registered email address
 * @returns {Promise<void>}
 */
const deliverResetLink = async (email) => {
  const user = await User.findOne({ email, account_status: 'ACTIVE', email_verify_status: true });
  if (!user) return;
  const now = Date.now();
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const tokenValue = `${tokenHash}:${passwordVersion(user.password_hash)}`;
  try {
    await PasswordResetToken.findOneAndUpdate({
      _id: user._id,
      $or: [
        { expired_at: { $lte: new Date(now + RESET_TTL_MS - RESEND_COOLDOWN_MS) } },
        { is_used: true },
      ],
    }, { $set: {
      user_id: user._id, token_value: tokenValue,
      expired_at: new Date(now + RESET_TTL_MS), is_used: false,
    } }, { upsert: true, new: true });
  } catch (error) {
    if (error.code === 11000) return;
    throw error;
  }
  try {
    const resetLink = new URL('/reset-password', env.corsOrigin);
    resetLink.searchParams.set('token', rawToken);
    await sendPasswordResetEmail(user.email, user.full_name, resetLink.toString());
  } catch {
    await PasswordResetToken.deleteOne({ _id: user._id, token_value: tokenValue });
  }
};

/**
 * Schedule recovery without exposing account existence or SMTP timing to callers.
 * @param {string} email - Validated email address
 * @returns {void}
 */
export const forgotPassword = (email) => {
  // shortcut: in-process delivery can be lost on restart; use a durable queue when available.
  setImmediate(() => {
    deliverResetLink(email).catch(() => console.error('Password recovery delivery failed'));
  });
};

/**
 * Persist a password only if the original credential and active status still match.
 * @param {Object} user - User including the original password_hash
 * @param {string} passwordHash - Hash of the validated new password
 * @returns {Promise<Object>} Updated user including the new hash, for internal token issuance
 */
const updatePassword = async (user, passwordHash) => {
  const updatedUser = await User.findOneAndUpdate({
    _id: user._id, password_hash: user.password_hash || null, account_status: 'ACTIVE',
  }, { $set: {
    password_hash: passwordHash, has_password: true,
    failed_login_attempts: 0, is_login_locked: false,
  } }, { new: true });
  if (!updatedUser) throw new AppError('Password changed or account unavailable. Please try again', 409);
  await PasswordResetToken.deleteMany({ user_id: user._id });
  Promise.resolve().then(() => sendPasswordChangedEmail(user.email, user.full_name))
    .catch(() => console.error('Password change notification failed'));
  return updatedUser;
};

/**
 * Consume a valid recovery link once, then replace the unchanged original credential.
 * @param {Object} data - { token, new_password }
 * @returns {Promise<void>}
 */
export const resetPassword = async ({ token, new_password }) => {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const resetToken = await PasswordResetToken.findOne({
    token_value: new RegExp(`^${tokenHash}:`), is_used: false, expired_at: { $gt: new Date() },
  });
  if (!resetToken) throw new AppError(INVALID_LINK, 410);
  const user = await User.findById(resetToken.user_id).select('+password_hash');
  if (!user || user.account_status !== 'ACTIVE' || !user.email_verify_status) {
    throw new AppError(INVALID_LINK, 410);
  }
  if (resetToken.token_value !== `${tokenHash}:${passwordVersion(user.password_hash)}`) {
    throw new AppError(INVALID_LINK, 410);
  }
  if (user.password_hash && await bcrypt.compare(new_password, user.password_hash)) {
    throw new AppError('New password must differ from the current password', 400, {
      new_password: ['New password must differ from the current password'],
    });
  }
  const passwordHash = await bcrypt.hash(new_password, 12);
  const consumed = await PasswordResetToken.findOneAndUpdate({
    _id: resetToken._id, token_value: resetToken.token_value, is_used: false,
    expired_at: { $gt: new Date() },
  }, { $set: { is_used: true } }, { new: true });
  if (!consumed) throw new AppError(INVALID_LINK, 410);
  await updatePassword(user, passwordHash);
};

/**
 * Change an existing password or set the first password for a Google-only account.
 * @param {string} userId - Authenticated user's ID
 * @param {Object} data - { current_password?, new_password }
 * @returns {Promise<{user: Object, token: string}>} Safe refreshed user and replacement session
 */
export const changePassword = async (userId, { current_password, new_password }) => {
  const user = await User.findById(userId).select('+password_hash');
  if (!user || user.account_status !== 'ACTIVE') throw new AppError('Account unavailable', 403);
  if (user.password_hash) {
    if (!current_password || !await bcrypt.compare(current_password, user.password_hash)) {
      throw new AppError('Current password is incorrect', 400, {
        current_password: ['Current password is incorrect'],
      });
    }
    if (await bcrypt.compare(new_password, user.password_hash)) {
      throw new AppError('New password must differ from the current password', 400, {
        new_password: ['New password must differ from the current password'],
      });
    }
  } else if (!user.google_account || !user.google_account.google_id) {
    throw new AppError('Account has no linked Google login', 403);
  }
  const passwordHash = await bcrypt.hash(new_password, 12);
  const updatedUser = await updatePassword(user, passwordHash);
  const safeUser = updatedUser.toObject();
  delete safeUser.password_hash;
  safeUser.has_password = Boolean(updatedUser.password_hash);
  return { user: safeUser, token: issueToken(updatedUser) };
};
