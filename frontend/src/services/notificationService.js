import api from './api.js';

const BASE_URL = '/notifications/v1';

export const getUnreadCount = () => api.get(`${BASE_URL}/unread-count`);

export const notificationService = {
  getNotifications: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.patch(`${BASE_URL}/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post(`${BASE_URL}/mark-all-read`);
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await api.delete(`${BASE_URL}/${notificationId}`);
    return response.data;
  },

  getPreferences: async () => {
    const response = await api.get(`${BASE_URL}/preferences`);
    return response.data;
  },

  updatePreferences: async (payload) => {
    const response = await api.put(`${BASE_URL}/preferences`, payload);
    return response.data;
  },
};
