import api from './api.js';

// UC09 – View AI Tutor Suggestions
const BASE_URL = '/ai-suggestions/v1';

export const getTutorSuggestions = (requestId, params) => {
  return api.get(`${BASE_URL}/requests/${requestId}`, { params });
};

// Tính lại gợi ý ngay, không có dữ liệu gửi kèm
export const refreshTutorSuggestions = (requestId) => {
  return api.post(`${BASE_URL}/requests/${requestId}/refresh`, {});
};
