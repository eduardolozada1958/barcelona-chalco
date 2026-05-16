import { apiClient } from './client';
import type { ApiResponse } from './types';

export async function getPushVapidPublicKey() {
  const { data } = await apiClient.get<ApiResponse<{ publicKey: string | null }>>('/push/public/vapid-key');
  return data;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function subscribePush(body: PushSubscriptionPayload) {
  const { data } = await apiClient.post<ApiResponse<null>>('/push/public/subscribe', body);
  return data;
}

export async function unsubscribePush(endpoint: string) {
  const { data } = await apiClient.post<ApiResponse<null>>('/push/public/unsubscribe', { endpoint });
  return data;
}
