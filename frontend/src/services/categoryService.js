import api from './api';

export const getCategories = (type, params) => api.get(`/admin/v1/categories/${type}`, { params });
export const createCategory = (type, data) => api.post(`/admin/v1/categories/${type}`, data);
export const updateCategory = (type, id, data) => api.put(`/admin/v1/categories/${type}/${id}`, data);
export const deleteCategory = (type, id, reason) => api.delete(`/admin/v1/categories/${type}/${id}`, { data: { reason } });

export async function getPublicCategories(type) {
  const items = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await api.get(`/categories/v1/${type}`, { params: { page, limit: 100 } });
    items.push(...response.data.items);
    totalPages = response.data.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);
  return items;
}

export async function getPublicCategoryNames(type) {
  const items = await getPublicCategories(type);
  return items.map((item) => item.name);
}

export async function getTeachingCategoryOptions() {
  const [subjects, grades] = await Promise.all([getPublicCategories('subjects'), getPublicCategories('grades')]);
  return [
    ...subjects.map((item) => ({ type: 'subjects', category_id: item._id, name: item.name })),
    ...grades.map((item) => ({ type: 'grades', category_id: item._id, name: item.name })),
  ];
}
