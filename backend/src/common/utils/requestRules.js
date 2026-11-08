import { ENUMS } from '../../models/enums.js';

// BR-05: yêu cầu tự hết hạn sau 30 ngày. Kiểm tra khi đọc / ứng tuyển / mời, chưa có job đổi status sang EXPIRED
export const REQUEST_LIFETIME_DAYS = 30;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Mốc created_at cũ nhất mà một request OPEN còn được coi là hiệu lực
 * @param {Date} [now]
 * @returns {Date}
 */
export const getRequestCutoff = (now = new Date()) => {
  return new Date(now.getTime() - REQUEST_LIFETIME_DAYS * DAY_IN_MS);
};

/**
 * Request có đang mở cho gia sư xem / ứng tuyển / được mời không (OPEN và chưa quá 30 ngày)
 * @param {Object} request - { status, created_at }
 * @param {Date} [now]
 * @returns {boolean}
 */
export const isRequestAvailable = (request, now = new Date()) => {
  if (request.status !== ENUMS.ParentRequestsStatus.OPEN) {
    return false;
  }
  if (!request.created_at) {
    return false;
  }
  return new Date(request.created_at).getTime() >= getRequestCutoff(now).getTime();
};

/**
 * Chuyển Decimal128 / chuỗi số sang number, null nếu không hợp lệ
 * @param {*} value
 * @returns {number|null}
 */
export const decimalToNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value.toString());
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return null;
};

/**
 * Escape ký tự đặc biệt để đưa chuỗi người dùng nhập vào RegExp an toàn
 * @param {string} text
 * @returns {string}
 */
export const escapeRegex = (text) => {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
