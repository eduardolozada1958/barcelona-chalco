import { apiClient } from './client';
import type { ApiResponse } from './types';

export async function validateQrToken(token: string): Promise<ApiResponse<{ isValid: boolean; player?: unknown }>> {
  const { data } = await apiClient.get<ApiResponse<{ isValid: boolean; player?: unknown }>>(
    `/qr/validate/${encodeURIComponent(token)}`
  );
  return data;
}

/**
 * URL del PNG del QR. Siempre mismo origen (/api/v1 → proxy en Pages o Vite en dev).
 * Evita imágenes rotas por cargar onrender.com en <img> desde pages.dev.
 */
export function playerQrImageUrl(playerId: string): string {
  return `/api/v1/qr/player/${encodeURIComponent(playerId)}/image`;
}
