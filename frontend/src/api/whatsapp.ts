import { apiClient } from './client';
import type { ApiResponse } from './types';

export type WhatsAppStatus = {
  enabled: boolean;
  state: 'disabled' | 'connecting' | 'qr' | 'open' | 'closed';
  qr: string | null;
  qrDataUrl: string | null;
  eligibleRecipients: number;
  authStorage?: 'supabase' | 'disk';
  reconnectAttempts?: number;
  pairingWaitSec?: number;
  recovering?: boolean;
  linkingAfterQr?: boolean;
};

export async function getWhatsAppStatus() {
  const { data } = await apiClient.get<ApiResponse<WhatsAppStatus>>('/whatsapp/status');
  return data;
}

export async function reconnectWhatsApp() {
  const { data } = await apiClient.post<ApiResponse<WhatsAppStatus>>('/whatsapp/reconnect');
  return data;
}

export async function resetWhatsAppSession() {
  const { data } = await apiClient.post<ApiResponse<WhatsAppStatus>>('/whatsapp/reset-session');
  return data;
}

export async function sendWhatsAppTest() {
  const { data } = await apiClient.post<ApiResponse<{ sent: number; failed: number }>>('/whatsapp/test');
  return data;
}
