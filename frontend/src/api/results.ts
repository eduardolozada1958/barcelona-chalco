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

export interface CreateResultBody {
  matchId:          string;
  goalsScored?:     number;
  goalsConceded?:   number;
  matchReport?:     string | null;
  highlightUrl?:    string | null;
  featuredPlayerId?: string | null;
}

export async function listResultsAdmin(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/results', { params });
  return data;
}

export async function createResult(body: CreateResultBody) {
  const { data } = await apiClient.post<ApiResponse<unknown>>('/results', body);
  return data;
}
