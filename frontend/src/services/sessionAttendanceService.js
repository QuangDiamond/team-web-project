import api from './api';

export const getSessionAttendance = (classId, sessionId, params = {}) => (
  api.get(`/classroom/v1/${classId}/sessions/${sessionId}/attendance`, { params })
);

export const createSessionAttendance = (classId, sessionId, data) => (
  api.post(`/classroom/v1/${classId}/sessions/${sessionId}/attendance`, data)
);

export const updateSessionAttendance = (classId, sessionId, data) => (
  api.put(`/classroom/v1/${classId}/sessions/${sessionId}/attendance`, data)
);
