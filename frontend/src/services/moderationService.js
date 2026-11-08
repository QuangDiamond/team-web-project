import api from './api.js';

const BASE_URL = '/moderation/v1';

// UC38 / UC40 – Moderate Content & Reports (role ADMIN)
export const moderationService = {
  getReports: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getAuditLogs: async () => {
    const response = await api.get(`${BASE_URL}/audit-logs`);
    return response.data;
  },

  getReportDetails: async (reportId) => {
    const response = await api.get(`${BASE_URL}/${reportId}`);
    return response.data;
  },

  resolveReport: async (reportId, payload) => {
    const response = await api.post(`${BASE_URL}/${reportId}/resolve`, payload);
    return response;
  },
};
