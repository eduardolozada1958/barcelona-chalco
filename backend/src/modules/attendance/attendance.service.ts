import { supabaseAdmin } from '@config/database';
import { BadRequestError } from '@middlewares/error.middleware';
import {
  parsePeriodMonth,
  sessionDatesInMonth,
  sessionTypeForDate,
  currentPeriodMonthIso,
} from '@shared/utils/attendance-calendar';
import type { AttendanceUpsertBody } from './attendance.validation';

export type AttendanceGrid = {
  periodMonth: string;
  sessionDates: { date: string; type: 'match' | 'training'; label: string }[];
  players: { id: string; first_name: string; last_name: string; jersey_number: number | null }[];
  records: Record<string, Record<string, boolean>>;
};

const DAY_LABELS: Record<string, string> = {
  match: 'Juego',
  training: 'Entreno',
};

export class AttendanceService {
  static async getGrid(periodRaw?: string): Promise<AttendanceGrid> {
    const { year, month, iso: periodMonth } = parsePeriodMonth(periodRaw ?? currentPeriodMonthIso());
    const sessionDates = sessionDatesInMonth(year, month).map((d) => ({
      ...d,
      label: DAY_LABELS[d.type],
    }));

    const { data: players, error: pErr } = await supabaseAdmin
      .from('players')
      .select('id, first_name, last_name, jersey_number')
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('last_name', { ascending: true });
    if (pErr) throw new Error(pErr.message);

    const playerIds = (players ?? []).map((p) => String((p as { id: string }).id));
    const records: Record<string, Record<string, boolean>> = {};
    for (const p of players ?? []) {
      records[String((p as { id: string }).id)] = {};
    }

    if (playerIds.length > 0 && sessionDates.length > 0) {
      const minDate = sessionDates[0]!.date;
      const maxDate = sessionDates[sessionDates.length - 1]!.date;
      const { data: rows, error: aErr } = await supabaseAdmin
        .from('attendance_records')
        .select('player_id, attendance_date, present')
        .in('player_id', playerIds)
        .gte('attendance_date', minDate)
        .lte('attendance_date', maxDate);
      if (aErr) throw new Error(aErr.message);

      for (const r of rows ?? []) {
        const row = r as { player_id: string; attendance_date: string; present: boolean };
        const pid = String(row.player_id);
        const date = String(row.attendance_date).slice(0, 10);
        if (!records[pid]) records[pid] = {};
        records[pid][date] = Boolean(row.present);
      }
    }

    return {
      periodMonth,
      sessionDates,
      players: (players ?? []).map((p) => {
        const row = p as Record<string, unknown>;
        return {
          id:            String(row.id),
          first_name:    String(row.first_name ?? ''),
          last_name:     String(row.last_name ?? ''),
          jersey_number: row.jersey_number != null ? Number(row.jersey_number) : null,
        };
      }),
      records,
    };
  }

  static async upsertRecords(body: AttendanceUpsertBody, actorId: string) {
    const { iso: periodMonth } = parsePeriodMonth(body.periodMonth);
    const { year, month } = parsePeriodMonth(periodMonth);
    const validDates = new Set(sessionDatesInMonth(year, month).map((d) => d.date));

    const upserts: {
      player_id: string;
      attendance_date: string;
      present: boolean;
      updated_by: string;
      updated_at: string;
    }[] = [];

    for (const rec of body.records) {
      if (!validDates.has(rec.date)) {
        throw new BadRequestError(`Fecha sin sesión: ${rec.date}`);
      }
      if (!sessionTypeForDate(rec.date)) {
        throw new BadRequestError(`No hay entrenamiento o partido el ${rec.date}`);
      }
      upserts.push({
        player_id:       rec.playerId,
        attendance_date: rec.date,
        present:         rec.present,
        updated_by:      actorId,
        updated_at:      new Date().toISOString(),
      });
    }

    if (upserts.length > 0) {
      const { error } = await supabaseAdmin
        .from('attendance_records')
        .upsert(upserts, { onConflict: 'player_id,attendance_date' });
      if (error) throw new Error(error.message);
    }

    return AttendanceService.getGrid(periodMonth);
  }
}
