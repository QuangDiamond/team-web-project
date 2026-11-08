import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Lỗi trả về giữ lại status (vd: 403 chưa kích hoạt) và errors (lỗi theo từng field)
const toApiError = (err) => {
  const apiError = new Error('Something went wrong, please try again');
  apiError.status = 0;
  apiError.errors = null;

  if (err.response) {
    apiError.status = err.response.status;
    if (err.response.data && err.response.data.message) {
      apiError.message = err.response.data.message;
    }
    if (err.response.data && err.response.data.errors) {
      apiError.errors = err.response.data.errors;
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

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const apiError = toApiError(err);
    const isAccountLocked = apiError.status === 403 && apiError.message === ACCOUNT_LOCKED_MESSAGE;
    if (isAccountLocked && handleAccountLocked) {
      handleAccountLocked();
    }
    return Promise.reject(apiError);
  }
);

export default api;
