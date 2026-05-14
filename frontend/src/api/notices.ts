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

export interface CreateNoticeBody {
  title:          string;
  content:        string;
  type?:          'general' | 'urgent' | 'event' | 'training' | 'match' | 'administrative';
  audience?:      'all' | 'parents' | 'players' | 'coaches' | 'specific_category';
  targetCategory?: string | null;
  isPinned?:      boolean;
  coverImageUrl?: string | null;
  expiresAt?:     string | null;
}

export async function listNoticesAdmin(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/notices', { params });
  return data;
}

export async function createNotice(body: CreateNoticeBody) {
  const { data } = await apiClient.post<ApiResponse<unknown>>('/notices', body);
  return data;
}

export async function publishNotice(id: string) {
  const { data } = await apiClient.patch<ApiResponse<unknown>>(`/notices/${id}/publish`);
  return data;
}
