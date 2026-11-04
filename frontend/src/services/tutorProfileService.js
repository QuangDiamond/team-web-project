import api from './api.js';

// Hồ sơ gia sư của chính mình. getMyProfile trả về { profile: null | {...}, full_name }
const BASE_URL = '/tutor-profile/v1';

export const getMyProfile = () => api.get(`${BASE_URL}/me`);
export const saveMyProfile = (data) => api.put(`${BASE_URL}/me`, data);
