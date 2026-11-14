import api from './api.js';

// UC11 – Browse Requests & AI Post Suggestions. params: { q, subject, grade, area, mode, minBudget, maxBudget, page, limit }
const BASE_URL = '/tutor-requests/v1';

export const browseRequests = (params) => api.get(BASE_URL, { params });
export const getRequestFilters = () => api.get(`${BASE_URL}/filters`);
export const getTutorRequest = (requestId) => api.get(`${BASE_URL}/${requestId}`);
export const getSavedRequests = (params) => api.get(`${BASE_URL}/bookmarks`, { params });
export const saveRequest = (requestId) => api.put(`${BASE_URL}/${requestId}/bookmark`);
export const unsaveRequest = (requestId) => api.delete(`${BASE_URL}/${requestId}/bookmark`);
export const getSuggestedRequests = (params) => api.get(`${BASE_URL}/suggestions`, { params });
export const refreshSuggestedRequests = () => api.post(`${BASE_URL}/suggestions/refresh`);

const RANDOM_SUGGESTION_COUNT = 3;

// Lấy 3 gợi ý ngẫu nhiên trong toàn bộ gợi ý (mọi trang, bỏ trùng) để mỗi lần mở dashboard thấy gợi ý khác nhau
// shortcut: tải hết các trang gợi ý (limit 100/trang), chuyển sang API random ở backend nếu số gợi ý lớn
export const getRandomSuggestedRequests = async () => {
  const firstPage = await getSuggestedRequests({ page: 1, limit: 100 });
  const itemsById = new Map();
  firstPage.data.items.forEach((item) => itemsById.set(item._id, item));
  for (let page = 2; page <= firstPage.data.pagination.totalPages; page += 1) {
    const nextPage = await getSuggestedRequests({ page: page, limit: 100 });
    nextPage.data.items.forEach((item) => itemsById.set(item._id, item));
  }

  const pool = [...itemsById.values()];
  const picked = [];
  while (picked.length < RANDOM_SUGGESTION_COUNT && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return { ...firstPage, data: { ...firstPage.data, items: picked } };
};
