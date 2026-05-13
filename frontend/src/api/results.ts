import { apiClient } from './client';
import type { ApiResponse } from './types';

export async function listResultsPublic(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/results/public', { params });
  return data;
}

export async function latestResultPublic() {
  const { data } = await apiClient.get<ApiResponse<unknown>>('/results/public/latest');
  return data;
}

export async function listResultsAdmin(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/results', { params });
  return data;
}
