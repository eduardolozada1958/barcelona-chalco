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

export async function unlockUserLogin(id: string) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(`/users/${id}/unlock-login`);
  return data;
}

export async function updateUser(
  id: string,
  body: { status?: string; fullName?: string; phone?: string | null; role?: string },
) {
  const { data } = await apiClient.patch<ApiResponse<unknown>>(`/users/${id}`, body);
  return data;
}

export async function requestUserEmailChange(id: string, newEmail: string) {
  const { data } = await apiClient.post<ApiResponse<{ newEmail: string }>>(`/users/${id}/request-email-change`, {
    newEmail,
  });
  return data;
}

export function isUserLoginLocked(u: Record<string, unknown>): boolean {
  if (u.login_locked_at) return true;
  const attempts = typeof u.failed_login_attempts === 'number' ? u.failed_login_attempts : 0;
  return attempts >= 5;
}

/** Elimina cuenta (soft delete). No puede ser tu propio usuario. */
export async function deleteUser(id: string) {
  const { data } = await apiClient.delete<ApiResponse<{ ok: boolean }>>(`/users/${id}`);
  return data;
}
