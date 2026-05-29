import { apiClient } from './client';
import type { ApiResponse } from './types';

export type WhatsAppRecipientDiagnostics = {
  eligible: number;
  optedOut: number;
  noPhone: number;
  emailNotVerified: number;
  accountNotActive: number;
  noApprovedChild: number;
  duplicatePhone: number;
};

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
  testRecipient?: { name: string; phone: string; phoneSource: string } | null;
  diagnostics?: WhatsAppRecipientDiagnostics;
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
  const { data } = await apiClient.post<ApiResponse<{ sent: number; failed: number; batchId?: string | null }>>('/whatsapp/test');
  return data;
}

export type WhatsAppDeliveryBatchSummary = {
  id: string;
  kind: string;
  kindLabel: string;
  referenceId: string | null;
  title: string;
  messagePreview: string | null;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  createdAt: string;
  finishedAt: string | null;
};

export type WhatsAppDeliveryEntry = {
  id: string;
  parentId: string | null;
  userId: string | null;
  parentName: string;
  email: string | null;
  phoneMasked: string | null;
  linkStatus: string;
  approvedChildren: number;
  pendingChildren: number;
  outcome: 'sent' | 'failed' | 'skipped';
  skipReason: string | null;
  skipReasonLabel: string;
  errorMessage: string | null;
};

export type WhatsAppDeliveryBatchDetail = {
  batch: WhatsAppDeliveryBatchSummary;
  entries: WhatsAppDeliveryEntry[];
};

export async function listWhatsAppDeliveryBatches(params?: { page?: number; limit?: number }) {
  const { data } = await apiClient.get<
    ApiResponse<WhatsAppDeliveryBatchSummary[]> & { meta?: { page: number; totalPages: number } }
  >('/whatsapp/delivery-batches', { params });
  return data;
}

export async function getWhatsAppDeliveryBatch(id: string) {
  const { data } = await apiClient.get<ApiResponse<WhatsAppDeliveryBatchDetail>>(`/whatsapp/delivery-batches/${id}`);
  return data;
}
