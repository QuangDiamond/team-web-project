import { AppError } from './AppError.js';

/**
 * Chặn tài khoản không đúng role.
 * TODO: thay bằng authorize(...roles) ở route khi middleware authorize được xây dựng (AGENTS.md: Planned)
 * @param {Object} user - req.user { id, role }
 * @param {string} role - role được phép, ví dụ 'PARENT'
 * @returns {void}
 */
export const assertRole = (user, role) => {
  if (user.role !== role) {
    throw new AppError(`Only ${role.toLowerCase()} accounts can use this feature`, 403);
  }
};
