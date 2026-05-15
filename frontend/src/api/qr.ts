import { apiClient } from './client';
import type { ApiResponse } from './types';

const API_HOST_FALLBACK = 'https://barcelona-chalco.onrender.com';

export async function validateQrToken(token: string): Promise<ApiResponse<{ isValid: boolean; player?: unknown }>> {
  const { data } = await apiClient.get<ApiResponse<{ isValid: boolean; player?: unknown }>>(
    `/qr/validate/${encodeURIComponent(token)}`
  );
  return data;
}

export function playerQrImageUrl(playerId: string): string {
  if (import.meta.env.DEV) return `/api/v1/qr/player/${playerId}/image`;
  const fromEnv = String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
  const host = fromEnv || API_HOST_FALLBACK;
  return `${host}/api/v1/qr/player/${playerId}/image`;
}
