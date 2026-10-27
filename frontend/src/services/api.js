import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Lỗi trả về giữ lại status (vd: 403 chưa kích hoạt) và errors (lỗi theo từng field)
const toApiError = (err) => {
  const apiError = new Error('Something went wrong, please try again');
  apiError.status = 0;
  apiError.errors = null;

  if (err.response) {
    apiError.status = err.response.status;
    if (err.response.data && err.response.data.message) {
      apiError.message = err.response.data.message;
    }
    if (err.response.data && err.response.data.errors) {
      apiError.errors = err.response.data.errors;
    }
  }
  return apiError;
};

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(toApiError(err))
);

export default api;
