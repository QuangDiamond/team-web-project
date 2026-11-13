import api from './api.js';

// Liên kết phụ huynh – học sinh bằng lời mời xác nhận (độc lập với lớp học)
const BASE_URL = '/parent-links/v1';

// Phụ huynh xem học sinh đã mời / đã liên kết; học sinh xem phụ huynh đã mời mình / đã liên kết. params: { status, page, limit }
export const getMyParentLinks = (params) => api.get(BASE_URL, { params });
// Phụ huynh mời học sinh bằng email. Server luôn trả cùng một thông báo dù email có tồn tại hay không
export const inviteStudentByEmail = (studentEmail) => api.post(BASE_URL, { student_email: studentEmail });
// Học sinh trả lời lời mời: action = 'ACCEPT' | 'DECLINE'
export const respondToParentLink = (linkId, action) => api.post(`${BASE_URL}/${linkId}/respond`, { action: action });
// Hủy lời mời đang chờ (phụ huynh) hoặc hủy liên kết đã có (phụ huynh / học sinh)
export const removeParentLink = (linkId) => api.delete(`${BASE_URL}/${linkId}`);
