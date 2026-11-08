import api from './api.js';

// UC10 – Manage Tutoring Requests. params: { status, page, limit }
const BASE_URL = '/parent-requests/v1';

export const getMyRequests = (params) => api.get(BASE_URL, { params });
export const getMyRequest = (requestId) => api.get(`${BASE_URL}/${requestId}`);
export const createRequest = (data) => api.post(BASE_URL, data);
export const updateRequest = (requestId, data) => api.put(`${BASE_URL}/${requestId}`, data);
// Xóa hẳn request (server chặn khi request đã có hội thoại với gia sư)
export const deleteRequest = (requestId) => api.delete(`${BASE_URL}/${requestId}`);
export const getMyChildren = () => api.get(`${BASE_URL}/children`);
