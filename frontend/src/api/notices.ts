import { apiClient } from './client';
import type { ApiResponse } from './types';

export async function listNoticesPublic(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/notices/public', { params });
  return data;
}

export async function getNoticePublic(id: string) {
  const { data } = await apiClient.get<ApiResponse<unknown>>(`/notices/public/${id}`);
  return data;
}

export async function listNoticesAdmin(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/notices', { params });
  return data;
}
