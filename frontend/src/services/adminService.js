import api from './api.js';

// Plans & Pricing (UC39). Mọi request đều cần cookie đăng nhập của Admin.
// Admin cần thấy toàn bộ gói nên lấy 1 trang lớn (limit tối đa 100)
export const getPlans = () => api.get('/admin/v1/plans', { params: { page: 1, limit: 100 } });
export const updatePlan = (planId, data) => api.put(`/admin/v1/plans/${planId}`, data);

export const getCreditPacks = () => api.get('/admin/v1/credit-packs', { params: { page: 1, limit: 100 } });
export const createCreditPack = (data) => api.post('/admin/v1/credit-packs', data);
export const updateCreditPack = (packId, data) => api.put(`/admin/v1/credit-packs/${packId}`, data);
export const updateCreditPackStatus = (packId, data) => api.patch(`/admin/v1/credit-packs/${packId}/status`, data);

// User Management (UC37). params: { page, limit, q, role, status, from, to } (bỏ trống thì không lọc)
export const getUsers = (params) => api.get('/admin/v1/users', { params });
export const getUserDetail = (userId) => api.get(`/admin/v1/users/${userId}`);
// body: { account_status: 'ACTIVE' | 'SUSPENDED' | 'BANNED', reason }
export const updateUserStatus = (userId, data) => api.patch(`/admin/v1/users/${userId}/status`, data);
// A1: tạo admin mới với mật khẩu tạm. body: { full_name, email, reason } -> { user, temporary_password }
export const createAdmin = (data) => api.post('/admin/v1/users/admins', data);
