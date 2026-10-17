import axios from 'axios';

const api = axios.create({
  baseURL: process.env.BACKEND_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
