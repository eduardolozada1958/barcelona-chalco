import { apiClient, resolveApiBaseUrl } from './client';
import type { ApiResponse } from './types';

export async function validateQrToken(token: string): Promise<ApiResponse<{ isValid: boolean; player?: unknown }>> {
  const { data } = await apiClient.get<ApiResponse<{ isValid: boolean; player?: unknown }>>(
    `/qr/validate/${encodeURIComponent(token)}`
  );
  return data;
}

/** PNG del QR (misma base que el resto del API en producción). Requiere token QR del jugador. */
export function playerQrImageUrl(playerId: string, qrToken: string): string {
  const params = new URLSearchParams({ token: qrToken });
  return `${resolveApiBaseUrl()}/qr/player/${encodeURIComponent(playerId)}/image?${params.toString()}`;
}
