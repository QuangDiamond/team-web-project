import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(new Error(err.response?.data?.message || 'Có lỗi xảy ra'))
);

export default api;
