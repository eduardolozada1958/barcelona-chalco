import { apiClient } from './client';
import type { ApiResponse } from './types';

export type AttendanceGrid = {
  periodMonth: string;
  sessionDates: { date: string; type: 'match' | 'training'; label: string }[];
  players: { id: string; first_name: string; last_name: string; jersey_number: number | null }[];
  records: Record<string, Record<string, boolean>>;
};

export async function getAttendanceGrid(period?: string) {
  const { data } = await apiClient.get<ApiResponse<AttendanceGrid>>('/attendance', {
    params: period ? { period } : undefined,
  });
  return data;
}

export async function saveAttendance(
  body: { periodMonth: string; records: { playerId: string; date: string; present: boolean }[] },
) {
  const { data } = await apiClient.put<ApiResponse<AttendanceGrid>>('/attendance', body);
  return data;
}
