import api from "./api.js"

export const login = (credential) => api.post('/auth/v1/login',credential);
export const register = (data) => api.post('/auth/v1/register', data);
