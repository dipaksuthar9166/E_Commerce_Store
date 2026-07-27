import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiBase';

// LAN-aware base URL: phone → same Wi‑Fi IP as frontend; PC → localhost
const api = axios.create({
  baseURL: getApiBaseUrl(),
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
