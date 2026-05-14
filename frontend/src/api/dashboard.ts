import { apiClient } from './client';
import type { ApiResponse } from './types';

export interface DashboardStats {
  totalPlayers:         number;
  verifiedPlayers:      number;
  newPlayersThisMonth:  number;
  pendingInscriptions:  number;
}

export async function getDashboardStats() {
  const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  return data;
}
