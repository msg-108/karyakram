import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, TOKEN_KEY } from '../config/constants';

// Create base Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-memory access token storage
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

// Queue for request retry while refresh is pending
interface FailedRequestQueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequestQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Bearer Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (inMemoryAccessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Automatic Refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't intercept auth endpoints like login or refresh itself
    if (
      originalRequest.url?.includes('/auth/login/') ||
      originalRequest.url?.includes('/auth/token/refresh/')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken = localStorage.getItem(TOKEN_KEY);

      if (!storedRefreshToken) {
        isRefreshing = false;
        setAccessToken(null);
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<{ access: string; refresh?: string }>(
          `${API_BASE_URL}/auth/token/refresh/`,
          { refresh: storedRefreshToken }
        );

        const newAccessToken = data.access;
        setAccessToken(newAccessToken);

        if (data.refresh) {
          localStorage.setItem(TOKEN_KEY, data.refresh);
        }

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem(TOKEN_KEY);
        setAccessToken(null);
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Utility to parse human-readable messages out of DRF errors
 */
export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Unable to connect to server. Please check if the backend is running or try again later.';
    }
    const data = error.response?.data;
    if (typeof data === 'string') return data;
    if (data?.detail) return data.detail;
    if (data?.non_field_errors?.length) return data.non_field_errors.join(', ');
    if (typeof data === 'object' && data !== null) {
      const messages: string[] = [];
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          messages.push(`${key}: ${value.join(' ')}`);
        } else if (typeof value === 'string') {
          messages.push(`${key}: ${value}`);
        }
      }
      if (messages.length) return messages.join(' | ');
    }
    return error.message || 'An unexpected server error occurred.';
  }
  return (error as Error)?.message || 'An unknown error occurred.';
}
