import api from './api.js';

// Danh mục môn học cho ô chọn môn. Danh sách ngắn nên lấy một lần với limit tối đa
const BASE_URL = '/subjects/v1';

export const getSubjects = () => api.get(BASE_URL, { params: { page: 1, limit: 100 } });
