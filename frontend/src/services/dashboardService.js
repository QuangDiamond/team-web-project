import api from './api.js';

// Số liệu tổng hợp cho Parent Dashboard và Tutor Dashboard (danh sách chi tiết dùng các service có phân trang sẵn có)
const BASE_URL = '/dashboard/v1';

export const getParentSummary = () => api.get(`${BASE_URL}/parent/summary`);
export const getTutorSummary = () => api.get(`${BASE_URL}/tutor/summary`);
