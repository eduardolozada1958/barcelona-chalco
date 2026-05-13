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

export async function listPlayersAdmin(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/players', { params });
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
