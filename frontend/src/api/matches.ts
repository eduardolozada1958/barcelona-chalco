import { apiClient } from './client';
import type { ApiResponse } from './types';

export async function listMatchesPublic(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/matches/public', { params });
  return data;
}

export async function listMatchesUpcoming(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/matches/public/upcoming', { params });
  return data;
}

export async function getMatchPublic(id: string) {
  const { data } = await apiClient.get<ApiResponse<unknown>>(`/matches/public/${id}`);
  return data;
}

export async function listMatchesAdmin(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/matches', { params });
  return data;
}
