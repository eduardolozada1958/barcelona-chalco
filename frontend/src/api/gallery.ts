import { apiClient } from './client';
import type { ApiResponse } from './types';

export async function listGalleryPublic(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/gallery/public', { params });
  return data;
}

export async function getGalleryPublic(id: string) {
  const { data } = await apiClient.get<ApiResponse<unknown>>(`/gallery/public/${id}`);
  return data;
}

export async function listGalleryAdmin(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/gallery', { params });
  return data;
}
