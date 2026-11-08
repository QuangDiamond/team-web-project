import api from './api.js';

// UC12 – Apply to Request. data: { request_id, note }
const BASE_URL = '/applications/v1';

export const applyToRequest = (data) => api.post(BASE_URL, data);
export const getMyApplications = (params) => api.get(`${BASE_URL}/mine`, { params });
export const withdrawApplication = (applicationId) => api.patch(`${BASE_URL}/${applicationId}/withdraw`);

// Phụ huynh duyệt đơn ứng tuyển vào request của mình: Continue mở hội thoại 1-1, Skip bỏ qua
export const getReceivedApplications = (requestId, params) =>
  api.get(`/parent-requests/v1/${requestId}/applications`, { params });
export const continueApplication = (applicationId) => api.patch(`${BASE_URL}/${applicationId}/continue`);
export const skipApplication = (applicationId) => api.patch(`${BASE_URL}/${applicationId}/skip`);
