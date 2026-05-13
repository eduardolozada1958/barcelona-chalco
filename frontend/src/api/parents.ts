import { apiClient } from './client';
import type { ApiResponse } from './types';

export async function myPlayers() {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/parents/my-players');
  return data;
}

export async function listParents(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/parents', { params });
  return data;
}
