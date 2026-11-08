import api from './api.js';

const BASE_URL = '/classroom/v1';

export const getMyClassrooms = (params) => api.get(`${BASE_URL}/me`, { params });
