import api from './api';

/**
 * ===================================================
 * UC21: Khởi tạo lớp học trực tuyến mới
 * ===================================================
 */
export const createClassroom = async (data) => {
  return await api.post('/classroom/v1', data);
};

export const getMyClassrooms = async (params = {}) => {
  return await api.get('/classroom/v1', { params });
};

export const getClassroomDetail = async (id) => {
  return await api.get(`/classroom/v1/${id}`);
};

export const getConfirmedAgreements = async () => {
  return await api.get('/classroom/v1/agreements');
};

/**
 * ===================================================
 * UC22: Quản lý lớp học & Bảng tin
 * ===================================================
 */
export const updateClassroom = async (id, data) => {
  return await api.put(`/classroom/v1/${id}`, data);
};

export const updateClassroomStatus = async (id, status) => {
  return await api.patch(`/classroom/v1/${id}/status`, { status });
};

export const regenerateJoinCode = async (id) => {
  return await api.post(`/classroom/v1/${id}/regenerate-code`);
};

export const deleteClassroom = async (id) => {
  return await api.delete(`/classroom/v1/${id}`);
};

export const getClassAnnouncements = async (classroomId) => {
  return await api.get(`/classroom/v1/${classroomId}/announcements`);
};

export const createClassAnnouncement = async (classroomId, data) => {
  return await api.post(`/classroom/v1/${classroomId}/announcements`, data);
};

export const updateClassAnnouncement = async (classroomId, announcementId, data) => {
  return await api.put(`/classroom/v1/${classroomId}/announcements/${announcementId}`, data);
};

export const deleteClassAnnouncement = async (classroomId, announcementId) => {
  return await api.delete(`/classroom/v1/${classroomId}/announcements/${announcementId}`);
};

export const togglePinAnnouncement = async (classroomId, announcementId) => {
  return await api.patch(`/classroom/v1/${classroomId}/announcements/${announcementId}/pin`);
};

/**
 * ===================================================
 * UC23: Quản lý thành viên lớp học
 * ===================================================
 */
export const getClassMembers = async (classroomId) => {
  return await api.get(`/classroom/v1/${classroomId}/members`);
};

export const addMemberToClass = async (classroomId, data) => {
  return await api.post(`/classroom/v1/${classroomId}/members`, data);
};

export const removeMemberFromClass = async (classroomId, memberId, reason) => {
  return await api.delete(`/classroom/v1/${classroomId}/members/${memberId}`, {
    data: { reason },
  });
};

/**
 * ===================================================
 * UC24: Tham gia lớp học
 * ===================================================
 */
export const previewClassroom = async (joinCode) => {
  return await api.get(`/classroom/v1/preview/${joinCode}`);
};

export const joinClassroom = async (join_code, child_user_id = null) => {
  return await api.post('/classroom/v1/join', { join_code, child_user_id });
};

export const getPendingParentLinks = async () => {
  return await api.get('/classroom/v1/parent-links/pending');
};

export const respondParentChildLink = async (linkId, action) => {
  return await api.post(`/classroom/v1/parent-links/${linkId}/respond`, { action });
};

/**
 * ===================================================
 * UC33: Nhóm Chat lớp học
 * ===================================================
 */
export const createClassGroupChat = async (classroomId) => {
  return await api.post(`/classroom/v1/${classroomId}/chat/init`);
};

export const getClassGroupChat = async (classroomId) => {
  return await api.get(`/classroom/v1/${classroomId}/chat`);
};

export const sendClassChatMessage = async (classroomId, content, attachments = []) => {
  return await api.post(`/classroom/v1/${classroomId}/chat`, { content, attachments });
};

/**
 * ===================================================
 * UC26 & UC27: Bài tập & Chấm điểm
 * ===================================================
 */
export const getClassAssignments = async (classroomId) => {
  return await api.get(`/classroom/v1/${classroomId}/assignments`);
};

export const createAssignment = async (classroomId, data) => {
  return await api.post(`/classroom/v1/${classroomId}/assignments`, data);
};

export const updateAssignment = async (assignmentId, data) => {
  return await api.put(`/classroom/v1/assignments/${assignmentId}`, data);
};

export const deleteAssignment = async (assignmentId) => {
  return await api.delete(`/classroom/v1/assignments/${assignmentId}`);
};

export const getAssignmentDetail = async (assignmentId) => {
  return await api.get(`/classroom/v1/assignments/${assignmentId}`);
};

export const submitAssignment = async (assignmentId, answers) => {
  return await api.post(`/classroom/v1/assignments/${assignmentId}/submit`, { answers });
};

export const getSubmissionsForAssignment = async (assignmentId) => {
  return await api.get(`/classroom/v1/assignments/${assignmentId}/submissions`);
};

export const gradeSubmission = async (submissionId, data) => {
  return await api.post(`/classroom/v1/submissions/${submissionId}/grade`, data);
};

