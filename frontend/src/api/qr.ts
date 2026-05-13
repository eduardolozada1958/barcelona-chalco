import { apiClient } from './client';
import type { ApiResponse } from './types';

export async function validateQrToken(token: string): Promise<ApiResponse<{ isValid: boolean; player?: unknown }>> {
  const { data } = await apiClient.get<ApiResponse<{ isValid: boolean; player?: unknown }>>(
    `/qr/validate/${encodeURIComponent(token)}`
  );
  return data;
}

export function playerQrImageUrl(playerId: string): string {
  if (import.meta.env.DEV) return `/api/v1/qr/player/${playerId}/image`;
  const host = String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
  return `${host}/api/v1/qr/player/${playerId}/image`;
}
