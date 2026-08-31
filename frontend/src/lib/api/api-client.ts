import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { isNetworkError } from '@/lib/api/is-network-error';
import { networkStatus } from '@/lib/sync/network-status';

const API_URL = env.NEXT_PUBLIC_API_URL;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  timeoutErrorMessage: 'Request timed out',
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => {
    if (error) p.reject(error);
    else if (token) p.resolve(token);
  });
  pendingQueue = [];
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const currentOrgId = localStorage.getItem('currentOrgId');
    if (currentOrgId) {
      config.headers['x-organization-id'] = currentOrgId;
    }
  }
  return config;
});

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

apiClient.interceptors.response.use(
  (response) => {
    networkStatus.setOnline(true);
    return response;
  },
  async (error) => {
    if (isNetworkError(error)) {
      networkStatus.setOnline(false);
    }

    const originalRequest = error.config;
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      isRefreshing = true;

      const clearSessionAndRedirect = (err: unknown) => {
        processQueue(err, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(err);
      };

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          return clearSessionAndRedirect(error);
        }

        let lastAuthError: unknown;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          if (attempt > 0) {
            const delay = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1), 4000);
            const jitter = delay * (0.8 + Math.random() * 0.4);
            await new Promise(resolve => setTimeout(resolve, jitter));
          }

          try {
            const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
            const { accessToken, refreshToken: newRefresh } = response.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefresh);
            processQueue(null, accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          } catch (refreshAttemptError) {
            if (isNetworkError(refreshAttemptError)) {
              networkStatus.setOnline(false);
              processQueue(refreshAttemptError, null);
              return Promise.reject(refreshAttemptError);
            }
            lastAuthError = refreshAttemptError;
          }
        }

        return clearSessionAndRedirect(lastAuthError ?? error);
      } catch (refreshError) {
        if (isNetworkError(refreshError)) {
          networkStatus.setOnline(false);
          processQueue(refreshError, null);
          return Promise.reject(refreshError);
        }
        return clearSessionAndRedirect(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
