import api from './api';

export const getUserSessions = async (params = {}) => {
  return await api.get('/session/v1', { params });
};
