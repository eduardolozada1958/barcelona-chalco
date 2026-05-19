import { apiClient } from './client';
import type { ApiResponse } from './types';

export interface TotpStatus {
  enabled:   boolean;
  enabledAt: string | null;
}

export interface TotpSetupResult {
  otpauthUrl:   string;
  qrDataUrl:    string;
  manualSecret: string;
}

export interface TotpConfirmResult {
  backupCodes: string[];
}

export async function getTotpStatus(): Promise<ApiResponse<TotpStatus>> {
  const { data } = await apiClient.get<ApiResponse<TotpStatus>>('/auth/totp/status');
  return data;
}

export async function beginTotpSetup(): Promise<ApiResponse<TotpSetupResult>> {
  const { data } = await apiClient.post<ApiResponse<TotpSetupResult>>('/auth/totp/setup');
  return data;
}

export async function confirmTotpSetup(code: string): Promise<ApiResponse<TotpConfirmResult>> {
  const { data } = await apiClient.post<ApiResponse<TotpConfirmResult>>('/auth/totp/confirm', { code });
  return data;
}

export async function disableTotp(password: string, code: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth/totp/disable', { password, code });
  return data;
}

export async function loginTotp(
  pendingToken: string,
  code: string,
): Promise<ApiResponse<import('./auth').AuthTokens & { user: import('./auth').AuthUser }>> {
  const { data } = await apiClient.post('/auth/login/totp', { pendingToken, code });
  return data;
}
