import api from './api.js';

const BASE_URL = '/classroom/v1';

export const getMyClassrooms = (params) => api.get(`${BASE_URL}/me`, { params });
export const getClassSessions = (classId, params) => api.get(`${BASE_URL}/${classId}/sessions`, { params });
export const createClassSession = (classId, data) => api.post(`${BASE_URL}/${classId}/sessions`, data);
export const updateClassSession = (classId, sessionId, data) => api.patch(
  `${BASE_URL}/${classId}/sessions/${sessionId}`,
  data,
);
export const deleteClassSession = (classId, sessionId) => api.delete(`${BASE_URL}/${classId}/sessions/${sessionId}`);
export const getClassTopics = (classId, params) => api.get(`${BASE_URL}/${classId}/topics`, { params });
export const createClassTopic = (classId, data) => api.post(`${BASE_URL}/${classId}/topics`, data);
export const updateClassTopic = (classId, topicId, data) => api.patch(`${BASE_URL}/${classId}/topics/${topicId}`, data);
export const deleteClassTopic = (classId, topicId) => api.delete(`${BASE_URL}/${classId}/topics/${topicId}`);
export const createClassMaterial = (classId, data) => api.post(
  `${BASE_URL}/${classId}/materials`,
  data,
  { headers: { 'Content-Type': 'multipart/form-data' } },
);
export const getClassMaterials = (classId, params) => api.get(`${BASE_URL}/${classId}/materials`, { params });
export const updateClassMaterial = (classId, materialId, data) => api.patch(
  `${BASE_URL}/${classId}/materials/${materialId}`,
  data,
  { headers: { 'Content-Type': 'multipart/form-data' } },
);
export const deleteClassMaterial = (classId, materialId) => api.delete(`${BASE_URL}/${classId}/materials/${materialId}`);
