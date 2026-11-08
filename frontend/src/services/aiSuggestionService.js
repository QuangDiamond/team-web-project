import api from './api.js';

// UC09 – View AI Tutor Suggestions
const BASE_URL = '/ai-suggestions/v1';

export const getTutorSuggestions = (requestId, params) => {
  return api.get(`${BASE_URL}/requests/${requestId}`, { params });
};

// weights: { budget, rating, schedule, area } mỗi giá trị 0..100
export const refreshTutorSuggestions = (requestId, weights) => {
  return api.post(`${BASE_URL}/requests/${requestId}/refresh`, { weights });
};
