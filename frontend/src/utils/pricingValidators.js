// Kiểm tra dữ liệu form Plans & Pricing (UC39 E1), giống rule ở backend (docs/api/admin-plans.md).
// Mỗi hàm trả về '' nếu hợp lệ, ngược lại trả về câu thông báo lỗi.

export const REASON_MAX_LENGTH = 500;
export const PACK_NAME_MAX_LENGTH = 100;
export const MAX_PRICE = 1000000000;
export const MAX_CREDITS = 1000000;
export const MAX_CLASS_LIMIT = 1000;

const isWholeNumber = (text) => /^\d+$/.test(text);

const formatLimit = (number) => number.toLocaleString('vi-VN');

// Số nguyên trong khoảng [minimum, maximum]
const validateWholeNumber = (rawValue, label, minimum, maximum) => {
  const text = String(rawValue).trim();
  if (text.length === 0) {
    return `${label} là thông tin bắt buộc`;
  }
  if (text.startsWith('-')) {
    return `${label} không được âm`;
  }
  if (!isWholeNumber(text)) {
    return `${label} phải là số nguyên`;
  }
  const number = Number(text);
  if (number < minimum) {
    return `${label} phải từ ${formatLimit(minimum)} trở lên`;
  }
  if (number > maximum) {
    return `${label} không được vượt quá ${formatLimit(maximum)}`;
  }
  return '';
};

// ----- Plan -----
export const validatePlanPrice = (rawValue) => validateWholeNumber(rawValue, 'Giá', 0, MAX_PRICE);

// D1: mọi plan (kể cả Free) phải có ít nhất 1 credit/tháng
export const validatePlanCredits = (rawValue) => validateWholeNumber(rawValue, 'Số credits mỗi tháng', 1, MAX_CREDITS);

export const validateAiQuota = (rawValue) => validateWholeNumber(rawValue, 'Hạn mức AI', 0, MAX_CREDITS);

// Chọn "Unlimited" thì không cần nhập số lớp
export const validateClassLimit = (rawValue, isUnlimited) => {
  if (isUnlimited) {
    return '';
  }
  return validateWholeNumber(rawValue, 'Số lớp tối đa', 1, MAX_CLASS_LIMIT);
};

// ----- Credit pack (E1: giá phải > 0, 0 credit không hợp lệ) -----
export const validatePackPrice = (rawValue) => validateWholeNumber(rawValue, 'Giá', 1, MAX_PRICE);

export const validatePackCredits = (rawValue) => validateWholeNumber(rawValue, 'Số credits', 1, MAX_CREDITS);

export const validatePackName = (rawValue) => {
  const text = rawValue.trim();
  if (text.length === 0) {
    return 'Vui lòng nhập tên gói';
  }
  if (text.length > PACK_NAME_MAX_LENGTH) {
    return `Tên gói không được quá ${PACK_NAME_MAX_LENGTH} ký tự`;
  }
  return '';
};

// BR-16: mọi thao tác của Admin đều phải có lý do
export const validateReason = (rawValue) => {
  const text = rawValue.trim();
  if (text.length === 0) {
    return 'Vui lòng nhập lý do thay đổi';
  }
  if (text.length > REASON_MAX_LENGTH) {
    return `Lý do không được quá ${REASON_MAX_LENGTH} ký tự`;
  }
  return '';
};

export const hasErrors = (errors) => {
  return Object.values(errors).some((message) => Boolean(message));
};
