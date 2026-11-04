import api from './api.js';

export const getCreditBalance = () => api.get('/credits/v1/balance');
