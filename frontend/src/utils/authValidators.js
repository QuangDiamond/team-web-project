// Validate phía frontend, giữ đúng quy tắc với backend (BR-01, authSchema.js)
// Mỗi hàm trả về chuỗi lỗi, hoặc '' nếu hợp lệ

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const REGISTER_ROLES = ['STUDENT', 'TUTOR', 'PARENT'];

export const validateFullName = (fullName) => {
  const trimmed = fullName.trim();
  if (trimmed.length === 0) {
    return 'Full name is required';
  }
  if (trimmed.length > 100) {
    return 'Full name must be at most 100 characters';
  }
  return '';
};

export const validateEmail = (email) => {
  if (email.trim().length === 0) {
    return 'Email is required';
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return '';
};

// BR-01: 8–64 ký tự, ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số
export const validatePassword = (password) => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (password.length > 64) {
    return 'Password must be at most 64 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one digit';
  }
  return '';
};

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

// Độ mạnh mật khẩu 0–4, mỗi tiêu chí đạt được 1 điểm:
// (1) >= 8 ký tự, (2) có cả chữ hoa và chữ thường, (3) có chữ số, (4) có ký tự đặc biệt hoặc >= 12 ký tự
export const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) {
    score = score + 1;
  }
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
    score = score + 1;
  }
  if (/[0-9]/.test(password)) {
    score = score + 1;
  }
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) {
    score = score + 1;
  }
  return { score: score, label: STRENGTH_LABELS[score] };
};

export const validateConfirmPassword =(password, confirmPassword) => {
  if (confirmPassword.length === 0) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Confirm password does not match';
  }
  return '';
};

export const validateRole = (role) => {
  if (!REGISTER_ROLES.includes(role)) {
    return 'Please choose your role';
  }
  return '';
};

export const validateAgreeTerms = (agreeTerms) => {
  if (agreeTerms !== true) {
    return 'You must agree to the Terms of Service';
  }
  return '';
};

// Đưa con trỏ vào ô lỗi đầu tiên (theo thứ tự fieldOrder) sau khi submit lỗi
export const focusFirstInvalidField = (fieldOrder, errors) => {
  const firstInvalidField = fieldOrder.find((field) => errors[field]);
  if (!firstInvalidField) {
    return;
  }
  const element = document.getElementById(firstInvalidField);
  if (element) {
    element.focus();
  }
};

// Đổi errors của backend ({ field: [msg, ...] }) thành { field: msg }
export const toFieldErrors = (backendErrors) => {
  const fieldErrors = {};
  if (!backendErrors) {
    return fieldErrors;
  }
  Object.keys(backendErrors).forEach((field) => {
    const messages = backendErrors[field];
    if (messages && messages.length > 0) {
      fieldErrors[field] = messages[0];
    }
  });
  return fieldErrors;
};
