import api from './api.js';

// UC36 – Student Dashboard. params: { page, limit }
const BASE_URL = '/student-dashboard/v1';

export const getJoinedClasses = (params) => api.get(`${BASE_URL}/classes`, { params });
export const getUpcomingSessions = (params) => api.get(`${BASE_URL}/sessions/upcoming`, { params });
export const getPendingAssignments = (params) => api.get(`${BASE_URL}/assignments/pending`, { params });
export const getAllStudentAssignments = (params) => api.get(`${BASE_URL}/assignments`, { params });
export const getPublishedGrades = (params) => api.get(`${BASE_URL}/grades`, { params });
export const getLearningActivity = (params) => api.get(`${BASE_URL}/activity`, { params });
export const getSubmissionHistory = (params) => api.get(`${BASE_URL}/submissions/history`, { params });
export const getStudentSchedule = (params) => api.get(`${BASE_URL}/schedule`, { params });
