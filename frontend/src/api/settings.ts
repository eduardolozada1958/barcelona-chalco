import { apiClient } from './client';
import type { ApiResponse } from './types';

export async function getSettingsPublic(): Promise<ApiResponse<Record<string, unknown>>> {
  const { data } = await apiClient.get('/settings/public');
  return data;
}

export async function getSettingsAdmin(): Promise<ApiResponse<Record<string, unknown>>> {
  const { data } = await apiClient.get('/settings');
  return data;
}

export async function updateSettings(body: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
  const { data } = await apiClient.put('/settings', body);
  return data;
}
