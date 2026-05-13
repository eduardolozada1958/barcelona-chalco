import { apiClient } from './client';
import type { ApiResponse } from './types';

export type PublicInscriptionPayload = Record<string, unknown>;

export async function createInscriptionPublic(body: PublicInscriptionPayload) {
  const { data } = await apiClient.post<ApiResponse<unknown>>('/inscriptions/public', body);
  return data;
}

export async function listInscriptions(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/inscriptions', { params });
  return data;
}

export async function getInscription(id: string) {
  const { data } = await apiClient.get<ApiResponse<unknown>>(`/inscriptions/${id}`);
  return data;
}

export async function approveInscription(id: string, body?: { reviewNotes?: string | null }) {
  const { data } = await apiClient.patch<ApiResponse<unknown>>(`/inscriptions/${id}/approve`, body ?? {});
  return data;
}

export async function rejectInscription(id: string, body: { rejectionReason: string; reviewNotes?: string | null }) {
  const { data } = await apiClient.patch<ApiResponse<unknown>>(`/inscriptions/${id}/reject`, body);
  return data;
}

export async function convertInscription(id: string) {
  const { data } = await apiClient.post<ApiResponse<{ playerId: string }>>(`/inscriptions/${id}/convert`);
  return data;
}
