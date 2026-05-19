import { apiClient } from './client';
import type { ApiResponse } from './types';

export async function forgotPassword(email: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email }, {
    timeout: 30_000,
  });
  return data;
}

export async function resetPassword(body: {
  token:       string;
  newPassword: string;
}): Promise<ApiResponse<null>> {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth/reset-password', body);
  return data;
}
