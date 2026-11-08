import api from './api.js';

// UC14 – Invite Tutor. data: { request_id, tutor_profile_id, message }
const BASE_URL = '/invitations/v1';

export const inviteTutor = (data) => api.post(BASE_URL, data);
// Tất cả gia sư đang hoạt động để phụ huynh xem và mời. params: { q, page, limit }
export const getInvitableTutors = (params) => api.get(`${BASE_URL}/tutors`, { params });
export const getMyInvitations = (params) => api.get(`${BASE_URL}/mine`, { params });
export const cancelInvitation = (invitationId) => api.patch(`${BASE_URL}/${invitationId}/cancel`);

// Gia sư xem và phản hồi lời mời: Accept mở hội thoại 1-1, Decline từ chối
export const getReceivedInvitations = (params) => api.get(`${BASE_URL}/received`, { params });
export const acceptInvitation = (invitationId) => api.patch(`${BASE_URL}/${invitationId}/accept`);
export const declineInvitation = (invitationId) => api.patch(`${BASE_URL}/${invitationId}/decline`);
