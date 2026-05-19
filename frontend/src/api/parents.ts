import { apiClient } from './client';
import type { ApiResponse } from './types';

export type LinkRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ParentLinkRequest {
  id:               string;
  parentId:         string;
  playerId:         string;
  isPrimaryContact: boolean;
  relationship:     string;
  status:           LinkRequestStatus;
  requestedAt:      string;
  reviewedAt?:      string | null;
  rejectReason?:    string | null;
  player?: {
    id:        string;
    firstName: string;
    lastName:  string;
    category?: string;
    slug?:     string | null;
  } | null;
  parent?: {
    id:           string;
    firstName:    string;
    lastName:     string;
    relationship?: string;
  } | null;
}

export interface CreateLinkRequestBody {
  curp:             string;
  relationship:     string;
  isPrimaryContact?: boolean;
}

export async function myPlayers() {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/parents/my-players');
  return data;
}

export async function myLinkRequests() {
  const { data } = await apiClient.get<ApiResponse<ParentLinkRequest[]>>('/parents/link-requests/me');
  return data;
}

export async function createLinkRequest(body: CreateLinkRequestBody) {
  const { data } = await apiClient.post<ApiResponse<ParentLinkRequest>>('/parents/link-requests', body);
  return data;
}

export async function listLinkRequests(params?: { status?: string; page?: number; limit?: number }) {
  const { data } = await apiClient.get<ApiResponse<ParentLinkRequest[]>>('/parents/link-requests', { params });
  return data;
}

export async function approveLinkRequest(id: string) {
  const { data } = await apiClient.post<ApiResponse<ParentLinkRequest>>(`/parents/link-requests/${id}/approve`);
  return data;
}

export async function rejectLinkRequest(id: string, reason?: string) {
  const { data } = await apiClient.post<ApiResponse<ParentLinkRequest>>(
    `/parents/link-requests/${id}/reject`,
    { reason },
  );
  return data;
}

export async function listParents(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/parents', { params });
  return data;
}
