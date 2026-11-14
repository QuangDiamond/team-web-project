import api from './api';

export const getScheduleChangeRequests = (params = {}) => (
  api.get('/schedule-change-requests/v1', { params })
);

export const createScheduleChangeRequest = (data) => (
  api.post('/schedule-change-requests/v1', data)
);

export const respondScheduleChangeRequest = (requestId, data) => (
  api.patch(`/schedule-change-requests/v1/${requestId}/respond`, data)
);

// Người tạo sửa đề nghị của mình (còn PENDING, chưa quá hạn)
export const updateScheduleChangeRequest = (requestId, data) => (
  api.patch(`/schedule-change-requests/v1/${requestId}`, data)
);

// Người tạo rút đề nghị (lưu trạng thái WITHDRAWN)
export const withdrawScheduleChangeRequest = (requestId) => (
  api.patch(`/schedule-change-requests/v1/${requestId}/withdraw`)
);
