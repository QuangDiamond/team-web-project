import api from './api.js';

// UC35 – Phụ huynh theo dõi tiến độ của con. Danh sách con đã liên kết lấy từ parentRequestService.getMyChildren
const BASE_URL = '/child-progress/v1';

export const getChildSummary = (childId) => api.get(`${BASE_URL}/${childId}/summary`);
export const getChildClasses = (childId, params) => api.get(`${BASE_URL}/${childId}/classes`, { params });
export const getChildUpcomingSessions = (childId, params) => api.get(`${BASE_URL}/${childId}/sessions/upcoming`, { params });
export const getChildAttendance = (childId, params) => api.get(`${BASE_URL}/${childId}/attendance`, { params });
export const getChildResults = (childId, params) => api.get(`${BASE_URL}/${childId}/results`, { params });
// limit = số bài gần nhất, trả về xếp từ cũ đến mới để vẽ biểu đồ
export const getChildScoreTrend = (childId, params) => api.get(`${BASE_URL}/${childId}/results/trend`, { params });
export const getChildResultDetail = (childId, submissionId) => api.get(`${BASE_URL}/${childId}/results/${submissionId}`);
