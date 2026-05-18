import axios, { type AxiosError } from 'axios';

import { API_PREFIX, STORAGE_KEYS } from '@utils/constants';
import type { ApiResponse } from './types';

const PROD_API_HOST =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://barcelona-chalco.onrender.com';

/** En desarrollo usa el proxy de Vite (`/api` → backend). En prod, `VITE_API_URL` + prefijo. */
export function resolveApiBaseUrl(): string {
  if (import.meta.env.DEV) return API_PREFIX;
  return `${PROD_API_HOST}${API_PREFIX}`;
}

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30_000,
  headers: {
    Accept:       'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiResponse>) => {
    const status = error.response?.status;
    const payload = error.response?.data;
    if (status === 401) {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      if (!window.location.pathname.startsWith('/login')) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
    const err = new Error(payload?.message ?? error.message) as Error & { status?: number; payload?: ApiResponse };
    err.status = status;
    err.payload = payload;
    return Promise.reject(err);
  }
);
