import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';

export const passwordVersion = (passwordHash) => {
  return createHash('sha256').update(passwordHash || '').digest('hex');
};

export const issueToken = (user, passwordHash = user.password_hash) => {
  return jwt.sign(
    { sub: String(user._id || user.id), role: user.role, password_version: passwordVersion(passwordHash) },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
};
