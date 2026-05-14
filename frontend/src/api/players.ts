import { apiClient } from './client';
import type { ApiResponse } from './types';

export async function listPlayersPublic(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/players/public', { params });
  return data;
}

export async function getPlayerPublic(id: string) {
  const { data } = await apiClient.get<ApiResponse<unknown>>(`/players/public/${id}`);
  return data;
}

export interface CreatePlayerBody {
  firstName:         string;
  lastName:          string;
  birthDate:         string;
  nationality?:      string;
  position:          string;
  secondaryPosition?: string;
  jerseyNumber?:     number;
  dominantFoot?:     'right' | 'left' | 'both';
  heightCm?:         number;
  weightKg?:         number;
  category:          'Sub-11' | 'Sub-13' | 'Sub-15' | 'Sub-17' | 'Sub-20';
  sportDescription?: string;
  achievements?:    string;
  notes?:            string;
}

export async function listPlayersAdmin(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/players', { params });
  return data;
}

export async function createPlayer(body: CreatePlayerBody) {
  const { data } = await apiClient.post<ApiResponse<unknown>>('/players', body);
  return data;
}

export async function getPlayerAdmin(id: string) {
  const { data } = await apiClient.get<ApiResponse<unknown>>(`/players/${id}`);
  return data;
}

export async function verifyPlayer(id: string) {
  const { data } = await apiClient.patch<ApiResponse<unknown>>(`/players/${id}/verify`);
  return data;
}

export async function generatePlayerQr(id: string) {
  const { data } = await apiClient.patch<ApiResponse<{ qrToken: string }>>(`/players/${id}/generate-qr`);
  return data;
}
