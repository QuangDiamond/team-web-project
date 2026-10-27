import api from "./api.js"

export const login = (credential) => api.post('/auth/v1/login',credential);
export const register = (data) => api.post('/auth/v1/register', data);
export const me = () => api.get('/auth/v1/me');
