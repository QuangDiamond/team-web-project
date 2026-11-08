// Kiểm tra dữ liệu form Plans & Pricing (UC39 E1), giống rule ở backend (docs/api/admin-plans.md).
// Mỗi hàm trả về '' nếu hợp lệ, ngược lại trả về câu thông báo lỗi.

export const REASON_MAX_LENGTH = 500;
export const PACK_NAME_MAX_LENGTH = 100;
export const MAX_PRICE = 1000000000;
export const MAX_CREDITS = 1000000;
export const MAX_CLASS_LIMIT = 1000;

const isWholeNumber = (text) => /^\d+$/.test(text);

const formatLimit = (number) => number.toLocaleString('en-US');

// Số nguyên trong khoảng [minimum, maximum]
const validateWholeNumber = (rawValue, label, minimum, maximum) => {
  const text = String(rawValue).trim();
  if (text.length === 0) {
    return `${label} is required`;
  }
  if (text.startsWith('-')) {
    return `${label} cannot be negative`;
  }
  if (!isWholeNumber(text)) {
    return `${label} must be a whole number`;
  }
  const number = Number(text);
  if (number < minimum) {
    return `${label} must be at least ${formatLimit(minimum)}`;
  }
  if (number > maximum) {
    return `${label} must be at most ${formatLimit(maximum)}`;
  }
  return '';
};

// ----- Plan -----
export const validatePlanPrice = (rawValue) => validateWholeNumber(rawValue, 'Price', 0, MAX_PRICE);

// D1: mọi plan (kể cả Free) phải có ít nhất 1 credit/tháng
export const validatePlanCredits = (rawValue) => validateWholeNumber(rawValue, 'Credits per month', 1, MAX_CREDITS);

export const validateAiQuota = (rawValue) => validateWholeNumber(rawValue, 'AI quota', 0, MAX_CREDITS);

// Chọn "Unlimited" thì không cần nhập số lớp
export const validateClassLimit = (rawValue, isUnlimited) => {
  if (isUnlimited) {
    return '';
  }
  return validateWholeNumber(rawValue, 'Class limit', 1, MAX_CLASS_LIMIT);
};

// ----- Credit pack (E1: giá phải > 0, 0 credit không hợp lệ) -----
export const validatePackPrice = (rawValue) => validateWholeNumber(rawValue, 'Price', 1, MAX_PRICE);

export const validatePackCredits = (rawValue) => validateWholeNumber(rawValue, 'Credits', 1, MAX_CREDITS);

export const validatePackName = (rawValue) => {
  const text = rawValue.trim();
  if (text.length === 0) {
    return 'Pack name is required';
  }
  if (text.length > PACK_NAME_MAX_LENGTH) {
    return `Pack name must be at most ${PACK_NAME_MAX_LENGTH} characters`;
  }
  return '';
};

// BR-16: mọi thao tác của Admin đều phải có lý do
export const validateReason = (rawValue) => {
  const text = rawValue.trim();
  if (text.length === 0) {
    return 'Please enter a reason for this change';
  }
  if (text.length > REASON_MAX_LENGTH) {
    return `Reason must be at most ${REASON_MAX_LENGTH} characters`;
  }
  return '';
};

export const hasErrors = (errors) => {
  return Object.values(errors).some((message) => Boolean(message));
};
