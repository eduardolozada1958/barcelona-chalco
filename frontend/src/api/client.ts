import axios, { type AxiosError } from 'axios';

import { STORAGE_KEYS } from '@utils/constants';
import { getApiV1BaseUrl } from '@utils/api-origin';
import { getApiErrorMessage } from '@utils/api-error';
import type { ApiResponse } from './types';

const API_BASE_URL = getApiV1BaseUrl();

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
