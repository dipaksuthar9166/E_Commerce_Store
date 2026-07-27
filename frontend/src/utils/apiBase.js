/**
 * Resolve API / Socket base URLs for local + LAN (phone) testing.
 *
 * Problem: .env has http://localhost:5000 — works on the PC, but when you open
 * the frontend from a phone via http://192.168.x.x:5173, "localhost" on the
 * phone means the phone itself, so the backend never connects.
 *
 * Fix: if the page is loaded from a LAN/IP host and the env URL still points
 * at localhost/127.0.0.1, swap the hostname to match the page host.
 */

function isLoopbackHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

/**
 * Rewrite loopback host to the current page hostname when testing on LAN.
 * Leaves production / absolute non-local URLs unchanged.
 */
export function resolveLanUrl(url) {
  if (!url || typeof window === 'undefined') return url;

  try {
    const parsed = new URL(url);
    const pageHost = window.location.hostname;

    if (
      isLoopbackHost(parsed.hostname) &&
      pageHost &&
      !isLoopbackHost(pageHost)
    ) {
      parsed.hostname = pageHost;
      // strip trailing slash for consistent base URLs
      return parsed.toString().replace(/\/+$/, '');
    }
  } catch {
    // ignore invalid URLs
  }

  return String(url).replace(/\/+$/, '');
}

/** Ensure API base always ends with /api */
export function normalizeApiBase(raw) {
  const cleaned = String(raw || '').replace(/\/+$/, '');
  if (!cleaned) return 'http://localhost:5000/api';
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}

/** Final axios baseURL used by the app */
export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return resolveLanUrl(normalizeApiBase(raw));
}

/** Final Socket.IO origin (no /api path) */
export function getSocketBaseUrl() {
  if (import.meta.env.VITE_SOCKET_URL) {
    return resolveLanUrl(import.meta.env.VITE_SOCKET_URL);
  }
  const api = getApiBaseUrl();
  return api.replace(/\/api\/?$/, '') || 'http://localhost:5000';
}
