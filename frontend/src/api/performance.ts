import { apiClient } from './client';
import type { ApiResponse } from './types';

export type PerformanceEntry = {
  playerName: string;
  advance: string;
  difficulty?: string;
  playerId?: string | null;
};

export type PerformanceReport = {
  id: string;
  title: string;
  category: string;
  reportDate: string;
  entries: PerformanceEntry[];
  isPublished?: boolean;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export interface CreatePerformanceReportBody {
  title: string;
  category: string;
  reportDate: string;
  entries: PerformanceEntry[];
}

export async function listPerformancePublic(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<PerformanceReport[]>>('/performance/public', { params });
  return data;
}

export async function getPerformancePublic(id: string) {
  const { data } = await apiClient.get<ApiResponse<PerformanceReport>>(`/performance/public/${id}`);
  return data;
}

export async function listPerformanceAdmin(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<PerformanceReport[]>>('/performance', { params });
  return data;
}

export async function getPerformanceAdmin(id: string) {
  const { data } = await apiClient.get<ApiResponse<PerformanceReport>>(`/performance/${id}`);
  return data;
}

export async function createPerformanceReport(body: CreatePerformanceReportBody) {
  const { data } = await apiClient.post<ApiResponse<PerformanceReport>>('/performance', body);
  return data;
}

export async function updatePerformanceReport(id: string, body: Partial<CreatePerformanceReportBody>) {
  const { data } = await apiClient.put<ApiResponse<PerformanceReport>>(`/performance/${id}`, body);
  return data;
}

export async function publishPerformanceReport(id: string, publish = true) {
  const { data } = await apiClient.patch<ApiResponse<PerformanceReport>>(`/performance/${id}/publish`, { publish });
  return data;
}

export async function deletePerformanceReport(id: string) {
  const { data } = await apiClient.delete<ApiResponse<unknown>>(`/performance/${id}`);
  return data;
}
