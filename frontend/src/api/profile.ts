import { apiClient } from './client';
import type { ApiResponse } from './types';

export interface UserProfile {
  id:              string;
  email:           string;
  role:            string;
  full_name:       string | null;
  avatar_url:      string | null;
  phone:           string | null;
  totp_enabled?:   boolean;
  totp_enabled_at?: string | null;
  pending_email_change?: { newEmail: string; expiresAt: string } | null;
}

export async function updateProfile(body: {
  fullName?: string;
  phone?:    string | null;
}): Promise<ApiResponse<UserProfile>> {
  const { data } = await apiClient.patch<ApiResponse<UserProfile>>('/auth/profile', body);
  return data;
}

export async function changePassword(body: {
  currentPassword: string;
  newPassword:     string;
}): Promise<ApiResponse<null>> {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth/change-password', body);
  return data;
}

export async function uploadAvatar(file: File): Promise<ApiResponse<UserProfile>> {
  const form = new FormData();
  form.append('avatar', file);
  const { data } = await apiClient.post<ApiResponse<UserProfile>>('/auth/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000,
  });
  return data;
}
