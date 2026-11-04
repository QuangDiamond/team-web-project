import api from './api.js';

// UC11 – Browse Requests & AI Post Suggestions. params: { q, subject, grade, area, mode, minBudget, maxBudget, page, limit }
const BASE_URL = '/tutor-requests/v1';

export const browseRequests = (params) => api.get(BASE_URL, { params });
export const getRequestFilters = () => api.get(`${BASE_URL}/filters`);
export const getTutorRequest = (requestId) => api.get(`${BASE_URL}/${requestId}`);
export const getSavedRequests = (params) => api.get(`${BASE_URL}/bookmarks`, { params });
export const saveRequest = (requestId) => api.put(`${BASE_URL}/${requestId}/bookmark`);
export const unsaveRequest = (requestId) => api.delete(`${BASE_URL}/${requestId}/bookmark`);
export const getSuggestedRequests = (params) => api.get(`${BASE_URL}/suggestions`, { params });
export const refreshSuggestedRequests = () => api.post(`${BASE_URL}/suggestions/refresh`);
