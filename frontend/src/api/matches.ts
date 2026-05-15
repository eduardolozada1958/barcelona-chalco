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

export interface CreateMatchBody {
  title:             string;
  description?:      string | null;
  opponentName:      string;
  opponentLogoUrl?:  string | null;
  matchDate:         string;
  location:          string;
  locationMapsUrl?:  string | null;
  matchType?:        'league' | 'cup' | 'friendly' | 'tournament' | 'internal';
  category:          string;
  status?:           'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  isHome?:           boolean;
  bannerUrl?:        string | null;
  season?:           string;
  formationType?:    'football_7' | 'football_11' | null;
  startingLineup?:   string[] | null;
}

export type UpdateMatchBody = Partial<CreateMatchBody>;

export async function listMatchesAdmin(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/matches', { params });
  return data;
}

export async function createMatch(body: CreateMatchBody) {
  const { data } = await apiClient.post<ApiResponse<unknown>>('/matches', body);
  return data;
}

export async function updateMatch(id: string, body: UpdateMatchBody) {
  const { data } = await apiClient.put<ApiResponse<unknown>>(`/matches/${id}`, body);
  return data;
}

export async function deleteMatch(id: string) {
  const { data } = await apiClient.delete<ApiResponse<unknown>>(`/matches/${id}`);
  return data;
}

export async function uploadOpponentLogo(matchId: string, file: File) {
  const fd = new FormData();
  fd.append('logo', file);
  const { data } = await apiClient.post<ApiResponse<unknown>>(`/matches/${matchId}/opponent-logo`, fd, {
    timeout: 90_000,
    transformRequest: [
      (body, headers) => {
        if (headers && typeof headers === 'object') {
          delete (headers as Record<string, unknown>)['Content-Type'];
        }
        return body as FormData;
      },
    ],
  });
  return data;
}
