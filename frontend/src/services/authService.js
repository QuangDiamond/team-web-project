import api from "./api.js"

export const login = (credential) => api.post('/auth/v1/login',credential);
export const register = (data) => api.post('/auth/v1/register', data);
export const me = () => api.get('/auth/v1/me');
export const logout = () => api.post('/auth/v1/logout');
export const resendVerification = (email) => api.post('/auth/v1/resend-verification', { email });
export const completeGoogleRegister = (data) => api.post('/auth/v1/google/complete', data);

// Đăng nhập Google phải chuyển hẳn trình duyệt sang backend (không gọi bằng axios)
export const getGoogleLoginUrl = () => `${api.defaults.baseURL}/auth/v1/google`;
