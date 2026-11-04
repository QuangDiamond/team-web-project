import api from './api.js';

// Chat 1-1 giữa phụ huynh và gia sư. Tin nhắn trả về MỚI NHẤT TRƯỚC (page 1 = các tin mới nhất)
const BASE_URL = '/chat/v1';

export const getConversations = (params) => api.get(`${BASE_URL}/conversations`, { params });
export const getConversation = (conversationId) => api.get(`${BASE_URL}/conversations/${conversationId}`);
export const getMessages = (conversationId, params) => api.get(`${BASE_URL}/conversations/${conversationId}/messages`, { params });
export const sendMessage = (conversationId, content) => api.post(`${BASE_URL}/conversations/${conversationId}/messages`, { content });
export const markConversationRead = (conversationId) => api.post(`${BASE_URL}/conversations/${conversationId}/read`);
