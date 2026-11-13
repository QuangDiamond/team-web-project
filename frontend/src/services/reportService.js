import api from './api.js';

const BASE_URL = '/report/v1';

// UC38 – người dùng báo cáo nội dung vi phạm; Admin xử lý ở trang Kiểm duyệt
// payload: { target_type: 'POST' | 'REQUEST', target_id, reason }
export const createReport = (payload) => api.post(BASE_URL, payload);
