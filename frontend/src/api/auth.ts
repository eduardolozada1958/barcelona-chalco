import { apiClient } from './client';
import type { ApiResponse } from './types';

export interface LoginBody {
  email:    string;
  password: string;
}

export type LoginResponse =
  | { requiresTotp: true; pendingToken: string }
  | { requiresTotp: false; accessToken: string; refreshToken: string; user: AuthUser };

export interface RegisterParentBody {
  email:          string;
  password:       string;
  fullName:       string;
  phone?:         string;
  firstName:      string;
  lastName:       string;
  phonePrimary:   string;
  relationship:   string;
}

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
}

export interface AuthUser {
  id:       string;
  email:    string;
  role:     string;
  fullName?: string;
}

export async function login(body: LoginBody): Promise<ApiResponse<LoginResponse>> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', body);
  return data;
}

export interface RegisterParentResult {
  email:            string;
  verificationSent: boolean;
}

export async function verifyEmail(token: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth/verify-email', { token });
  return data;
}

export async function resendVerificationEmail(email: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth/resend-verification', { email }, {
    timeout: 15_000,
  });
  return data;
}

export async function registerParent(body: RegisterParentBody): Promise<ApiResponse<RegisterParentResult>> {
  const { data } = await apiClient.post<ApiResponse<RegisterParentResult>>('/auth/register', body, {
    timeout: 60_000,
  });
  return data;
}

export async function refresh(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
  const { data } = await apiClient.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken });
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function me(): Promise<ApiResponse<Record<string, unknown>>> {
  const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>('/auth/me');
  return data;
}

export async function requestEmailChange(body: {
  newEmail:        string;
  currentPassword: string;
}): Promise<ApiResponse<{ newEmail: string }>> {
  const { data } = await apiClient.post<ApiResponse<{ newEmail: string }>>('/auth/request-email-change', body);
  return data;
}

export async function confirmEmailChange(token: string): Promise<ApiResponse<{ email: string }>> {
  const { data } = await apiClient.post<ApiResponse<{ email: string }>>('/auth/confirm-email-change', { token });
  return data;
}
