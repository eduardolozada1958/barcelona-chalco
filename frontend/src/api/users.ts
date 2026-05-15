import { apiClient } from './client';
import type { ApiResponse } from './types';

export async function listUsers(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/users', { params });
  return data;
}

export async function getUser(id: string) {
  const { data } = await apiClient.get<ApiResponse<unknown>>(`/users/${id}`);
  return data;
}

export interface CreateUserBody {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'coach';
  phone?: string | null;
}

export async function createUser(body: CreateUserBody) {
  const { data } = await apiClient.post<ApiResponse<unknown>>('/users', body);
  return data;
}
