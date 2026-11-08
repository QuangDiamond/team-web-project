import api from './api.js';

const BASE_URL = '/stats/v1';

// UC40 / UC42 – View System Statistics & Public Home Stats
export const statsService = {
  getPublicHomeData: async () => {
    const response = await api.get(`${BASE_URL}/public`);
    return response.data;
  },

  getStats: async (period = '30d') => {
    const response = await api.get(BASE_URL, { params: { period } });
    return response.data;
  },

  exportReport: async (period = '30d') => {
    const response = await api.get(`${BASE_URL}/export`, { params: { period } });
    return response.data;
  },
};
