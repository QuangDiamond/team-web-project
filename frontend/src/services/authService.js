import api from "./api.js"

export const login = (credential) => api.post('/auth/v1/login',credential);
export const register = (data) => api.post('/auth/v1/register', data);
export const me = () => api.get('/auth/v1/me');
export const logout = () => api.post('/auth/v1/logout');
export const forgotPassword = (data) => api.post('/auth/v1/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/v1/reset-password', data);
export const changePassword = (data) => api.post('/auth/v1/change-password', data);
export const resendVerification = (email) => api.post('/auth/v1/resend-verification', { email });
export const completeGoogleRegister = (data) => api.post('/auth/v1/google/complete', data);

// Đăng nhập Google phải chuyển hẳn trình duyệt sang backend (không gọi bằng axios)
export const getGoogleLoginUrl = () => `${api.defaults.baseURL}/auth/v1/google`;
