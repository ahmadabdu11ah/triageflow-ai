import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'triageflow_access_token';
export const USER_STORAGE_KEY = 'triageflow_user';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: attach JWT Bearer token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 session expiration cleanly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isAuthAttempt =
      requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/register');

    if (status === 401 && !isAuthAttempt) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('triageflow:unauthorized'));
    }
    return Promise.reject(error);
  }
);

/**
 * Extracts a human-readable error message from a FastAPI error response.
 */
export function getErrorMessage(error, fallback = 'An unexpected error occurred.') {
  if (!error) return fallback;
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => {
        const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : '';
        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .join(', ');
  }
  if (error.message === 'Network Error') {
    return 'Cannot reach the TriageFlow API server (http://localhost:8000). Please ensure the FastAPI backend is running.';
  }
  return error.message || fallback;
}

export default apiClient;
