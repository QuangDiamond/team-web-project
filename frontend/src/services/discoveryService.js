import api from './api';

export const searchTutors = (params) => api.get('/discovery/v1/tutors', { params });

export const searchPosts = (params) => api.get('/discovery/v1/posts', { params });

export const getTutorPublicProfile = (profileId, params) => api.get(`/discovery/v1/tutors/${profileId}`, { params });
export const getParentPublicProfile = (userId, params) => api.get(`/discovery/v1/parents/${userId}`, { params });
