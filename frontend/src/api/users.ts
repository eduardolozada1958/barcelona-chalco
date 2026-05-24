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

export async function sendUserDeleteCode(id: string) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(`/users/${id}/send-delete-code`);
  return data;
}

export async function sendUserEmailChangeCode(id: string) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(`/users/${id}/send-email-change-code`);
  return data;
}

export async function requestUserEmailChange(id: string, newEmail: string, verificationCode?: string) {
  const { data } = await apiClient.post<ApiResponse<{ newEmail: string }>>(`/users/${id}/request-email-change`, {
    newEmail,
    ...(verificationCode ? { verificationCode } : {}),
  });
  return data;
}

export function isUserLoginLocked(u: Record<string, unknown>): boolean {
  if (u.login_locked_at) return true;
  const attempts = typeof u.failed_login_attempts === 'number' ? u.failed_login_attempts : 0;
  return attempts >= 5;
}

/** Elimina cuenta (soft delete). Requiere código enviado al correo del admin en producción. */
export async function deleteUser(id: string, verificationCode: string) {
  const { data } = await apiClient.delete<ApiResponse<{ ok: boolean }>>(`/users/${id}`, {
    data: { verificationCode },
  });
  return data;
}

export type UnlinkedParentsStats = {
  count: number;
  withEmail: number;
  withPhone: number;
  pendingEmail?: number;
};

export async function getUnlinkedParentsStats() {
  const { data } = await apiClient.get<ApiResponse<UnlinkedParentsStats>>('/users/unlinked-parents/stats');
  return data;
}

export type RemindUnlinkedResult = {
  targets: number;
  emailsSent: number;
  emailsFailed: number;
  whatsappSent: number;
  whatsappFailed: number;
  skippedNoEmail: number;
  skippedNoPhone: number;
};

export async function remindSingleParentCurp(
  userId: string,
  body: { sendEmail?: boolean; sendWhatsApp?: boolean },
) {
  const { data } = await apiClient.post<ApiResponse<RemindUnlinkedResult>>(
    `/users/${encodeURIComponent(userId)}/remind-curp-link`,
    body,
  );
  return data;
}

export async function remindUnlinkedParents(body: { sendEmail?: boolean; sendWhatsApp?: boolean }) {
  const { data } = await apiClient.post<ApiResponse<RemindUnlinkedResult>>('/users/unlinked-parents/remind', body);
  return data;
}
