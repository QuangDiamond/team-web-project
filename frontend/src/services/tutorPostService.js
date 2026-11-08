import api from './api.js';

// Bài đăng dạy học của chính gia sư. params: { status, page, limit }
const BASE_URL = '/tutor-posts/v1';

export const getMyPosts = (params) => api.get(`${BASE_URL}/mine`, { params });
export const getMyPost = (postId) => api.get(`${BASE_URL}/${postId}`);
export const createPost = (data) => api.post(BASE_URL, data);
export const updatePost = (postId, data) => api.put(`${BASE_URL}/${postId}`, data);
export const changePostStatus = (postId, status) => api.patch(`${BASE_URL}/${postId}/status`, { status });
export const deletePost = (postId) => api.delete(`${BASE_URL}/${postId}`);
