import axios from 'axios';

// Prefer env; always ensure base ends with /api so routes match backend mounts
const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const baseURL = rawBase.replace(/\/+$/, '').endsWith('/api')
  ? rawBase.replace(/\/+$/, '')
  : `${rawBase.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const { token } = JSON.parse(userInfo);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // ignore corrupt localStorage
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
