import { apiClient, resolveApiBaseUrl } from './client';
import type { ApiResponse } from './types';

export async function validateQrToken(token: string): Promise<ApiResponse<{ isValid: boolean; player?: unknown }>> {
  const { data } = await apiClient.get<ApiResponse<{ isValid: boolean; player?: unknown }>>(
    `/qr/validate/${encodeURIComponent(token)}`
  );
  return data;
}

/** PNG del QR (misma base que el resto del API en producción). */
export function playerQrImageUrl(playerId: string): string {
  return `${resolveApiBaseUrl()}/qr/player/${encodeURIComponent(playerId)}/image`;
}
