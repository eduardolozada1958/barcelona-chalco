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

export interface CreateGalleryPostBody {
  title:           string;
  caption?:        string | null;
  type?:           'match_day' | 'result' | 'featured_player' | 'training' | 'convocatory' | 'general' | 'achievement';
  relatedMatchId?: string | null;
  relatedPlayerId?: string | null;
  isFeatured?:     boolean;
  season?:         string;
  media?:          { url: string; type?: 'image' | 'video'; thumbnailUrl?: string | null; caption?: string | null; sortOrder?: number }[];
}

export async function listGalleryAdmin(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/gallery', { params });
  return data;
}

export async function createGalleryPost(body: CreateGalleryPostBody) {
  const { data } = await apiClient.post<ApiResponse<unknown>>('/gallery', body);
  return data;
}

export async function publishGalleryPost(id: string) {
  const { data } = await apiClient.patch<ApiResponse<unknown>>(`/gallery/${id}/publish`);
  return data;
}
