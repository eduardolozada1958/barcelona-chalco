import { apiClient } from './client';
import type { ApiResponse } from './types';

export type FeeMatrixRow = {
  player_id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  registration_paid: boolean;
  monthly_fee_paid: boolean;
  notes: string | null;
  linked_parents: { user_id: string; email: string; payment_hold: boolean }[];
};

export type FeeMatrixPayload = {
  periodMonth: string;
  rows: FeeMatrixRow[];
};

export async function getFeesMatrix(period?: string) {
  const { data } = await apiClient.get<ApiResponse<FeeMatrixPayload>>('/fees', {
    params: period ? { period } : undefined,
  });
  return data;
}

export async function updatePlayerFees(
  playerId: string,
  body: {
    periodMonth: string;
    registrationPaid?: boolean;
    monthlyFeePaid?: boolean;
    notes?: string | null;
  },
) {
  const { data } = await apiClient.patch<ApiResponse<FeeMatrixPayload>>(`/fees/players/${playerId}`, body);
  return data;
}

export async function syncPaymentHolds() {
  const { data } = await apiClient.post<ApiResponse<FeeMatrixPayload>>('/fees/sync-holds');
  return data;
}
