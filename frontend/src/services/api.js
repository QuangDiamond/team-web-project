import axios from 'axios';
import { translateSystemMessage } from '../utils/viMessages';

const UNTRANSLATED_ERROR_FALLBACK = 'Không thể thực hiện yêu cầu. Vui lòng kiểm tra thông tin và thử lại.';

const translateApiErrorMessage = (message, status) => {
  const translatedMessage = translateSystemMessage(message);
  if (status < 500 && translatedMessage === UNTRANSLATED_ERROR_FALLBACK) {
    return message;
  }
  return translatedMessage;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Lỗi trả về giữ lại status (vd: 403 chưa kích hoạt) và errors (lỗi theo từng field)
const toApiError = (err) => {
  const apiError = new Error('Có lỗi xảy ra, vui lòng thử lại.');
  apiError.rawMessage = '';
  apiError.status = 0;
  apiError.errors = null;

  if (err.response) {
    apiError.status = err.response.status;
    if (err.response.data && err.response.data.message) {
      apiError.rawMessage = err.response.data.message;
      apiError.message = translateApiErrorMessage(apiError.rawMessage, apiError.status);
    }
    if (err.response.data && err.response.data.errors) {
      apiError.errors = Object.fromEntries(Object.entries(err.response.data.errors).map(([field, messages]) => [
        field,
        Array.isArray(messages)
          ? messages.map((message) => translateApiErrorMessage(message, apiError.status))
          : translateApiErrorMessage(messages, apiError.status),
      ]));
    }
  }
  return apiError;
};

// Phải giống hệt ACCOUNT_LOCKED_MESSAGE của backend (auth.middleware.js). 403 khác (vd 'Forbidden') giữ nguyên
const ACCOUNT_LOCKED_MESSAGE = 'Your account has been suspended or banned';

// AuthProvider đăng ký hàm này: tài khoản bị khóa giữa chừng thì đăng xuất và đưa về /login (UC37-B3)
let handleAccountLocked = null;
export const setAccountLockedHandler = (handler) => {
  handleAccountLocked = handler;
};

let handleSessionExpired = null;
export const setSessionExpiredHandler = (handler) => {
  handleSessionExpired = handler;
};

api.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data.message === 'string') {
      res.data.message = translateSystemMessage(res.data.message, true);
    }
    return res.data;
  },
  (err) => {
    const apiError = toApiError(err);
    const isAccountLocked = apiError.status === 403 && apiError.rawMessage === ACCOUNT_LOCKED_MESSAGE;
    if (isAccountLocked && handleAccountLocked) {
      handleAccountLocked();
    }
    const requestPath = err.config?.url || '';
    const isProtectedRequest = !requestPath.startsWith('/auth/v1/') ||
      requestPath === '/auth/v1/me' || requestPath === '/auth/v1/change-password';
    if (apiError.status === 401 && isProtectedRequest && handleSessionExpired) {
      handleSessionExpired();
    }
    return Promise.reject(apiError);
  }
);

export default api;
