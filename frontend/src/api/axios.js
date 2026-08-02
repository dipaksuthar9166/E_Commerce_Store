import axios from 'axios';
import { getApiBaseUrl, getSocketBaseUrl } from '../utils/apiBase';

// LAN-aware base URL: phone → same Wi‑Fi IP as frontend; PC → localhost
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 25000, // fail faster than browser hang (Render cold start can be ~15–30s)
});

/**
 * Fire-and-forget wake-up for Render free tier.
 * Call as early as possible so the API is warming while JS/chunks load.
 */
export function warmBackend() {
  try {
    const base = getSocketBaseUrl();
    if (!base || /localhost|127\.0\.0\.1/.test(base)) return;
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = setTimeout(() => ctrl?.abort(), 20000);
    fetch(`${base.replace(/\/+$/, '')}/api/health`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      signal: ctrl?.signal,
    })
      .catch(() => {})
      .finally(() => clearTimeout(t));
  } catch {
    /* ignore */
  }
}

// Kick off as soon as this module is imported
warmBackend();

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
    // FormData must keep browser-generated multipart boundary.
    // If Content-Type is forced to "multipart/form-data" without boundary, multer gets no file.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) {
        if (typeof config.headers.delete === 'function') {
          config.headers.delete('Content-Type');
        } else {
          delete config.headers['Content-Type'];
          delete config.headers['content-type'];
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
