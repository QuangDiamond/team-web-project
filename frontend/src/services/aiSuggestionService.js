import api from './api.js';

// Profile/category-based tutor suggestions. No AI provider or quota is used.
const BASE_URL = '/suggestions/v1';

export const getTutorSuggestions = (requestId, params) => {
  return api.get(`${BASE_URL}/requests/${requestId}`, { params });
};

// Tính lại gợi ý ngay, không có dữ liệu gửi kèm
export const refreshTutorSuggestions = (requestId) => {
  return api.post(`${BASE_URL}/requests/${requestId}/refresh`, {});
};
