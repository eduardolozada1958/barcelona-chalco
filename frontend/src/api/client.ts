import axios, { type AxiosError } from 'axios';

import { STORAGE_KEYS } from '@utils/constants';
import { getApiErrorMessage } from '@utils/api-error';
import type { ApiResponse } from './types';

const DEFAULT_API_HOST = 'https://barcelona-chalco.onrender.com';

/** URL base del API — calculada una vez al cargar el módulo. */
const API_BASE_URL = (() => {
  // Desarrollo: proxy Vite en /api → backend local
  if (import.meta.env.MODE === 'development') {
    return '/api/v1';
  }
  // Producción: siempre URL absoluta a Render (nunca relativa a pages.dev)
  const host = String(import.meta.env.VITE_API_URL || DEFAULT_API_HOST).replace(/\/$/, '');
  return `${host}/api/v1`;
})();

export function resolveApiBaseUrl(): string {
  return API_BASE_URL;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    Accept:         'application/json',
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
    const err = new Error(getApiErrorMessage({ message: payload?.message, status, payload })) as Error & {
      status?: number;
      payload?: ApiResponse;
    };
    err.status = status;
    err.payload = payload;
    return Promise.reject(err);
  },
);
