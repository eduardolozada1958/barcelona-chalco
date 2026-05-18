import { apiClient } from './client';
import type { ApiResponse } from './types';

export interface LoginBody {
  email:    string;
  password: string;
}

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

export async function login(body: LoginBody): Promise<ApiResponse<AuthTokens & { user: AuthUser }>> {
  const { data } = await apiClient.post<ApiResponse<AuthTokens & { user: AuthUser }>>('/auth/login', body);
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
