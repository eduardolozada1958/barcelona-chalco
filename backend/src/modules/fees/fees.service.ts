import { supabaseAdmin } from '@config/database';
import { PARENT_PAYMENT_BLOCKED_MESSAGE } from '@config/coach-contact';
import { NotFoundError, UnauthorizedError } from '@middlewares/error.middleware';
import { parsePeriodMonth, currentPeriodMonthIso } from '@shared/utils/attendance-calendar';
import type { UpdatePlayerFeesBody } from './fees.validation';

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

export class FeesService {
  static async listMatrix(periodRaw?: string): Promise<{ periodMonth: string; rows: FeeMatrixRow[] }> {
    const { iso: periodMonth } = parsePeriodMonth(periodRaw ?? currentPeriodMonthIso());

    const { data: players, error: pErr } = await supabaseAdmin
      .from('players')
      .select('id, first_name, last_name, jersey_number, registration_paid')
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('last_name', { ascending: true });
    if (pErr) throw new Error(pErr.message);

    const playerIds = (players ?? []).map((p) => String((p as { id: string }).id));
    const feeMap = new Map<string, { monthly_fee_paid: boolean; notes: string | null }>();

    if (playerIds.length > 0) {
      const { data: fees, error: fErr } = await supabaseAdmin
        .from('player_monthly_fees')
        .select('player_id, monthly_fee_paid, notes')
        .eq('period_month', periodMonth)
        .in('player_id', playerIds);
      if (fErr) throw new Error(fErr.message);
      for (const f of fees ?? []) {
        const row = f as { player_id: string; monthly_fee_paid: boolean; notes: string | null };
        feeMap.set(String(row.player_id), {
          monthly_fee_paid: Boolean(row.monthly_fee_paid),
          notes: row.notes,
        });
      }
    }

    const parentMap = await FeesService.loadLinkedParentsByPlayer(playerIds);

    const rows: FeeMatrixRow[] = (players ?? []).map((p) => {
      const row = p as Record<string, unknown>;
      const id = String(row.id);
      const fee = feeMap.get(id);
      return {
        player_id:          id,
        first_name:         String(row.first_name ?? ''),
        last_name:          String(row.last_name ?? ''),
        jersey_number:      row.jersey_number != null ? Number(row.jersey_number) : null,
        registration_paid:  Boolean(row.registration_paid),
        monthly_fee_paid:   fee?.monthly_fee_paid ?? false,
        notes:              fee?.notes ?? null,
        linked_parents:     parentMap.get(id) ?? [],
      };
    });

    return { periodMonth, rows };
  }

  private static async loadLinkedParentsByPlayer(playerIds: string[]) {
    const map = new Map<string, FeeMatrixRow['linked_parents']>();
    if (playerIds.length === 0) return map;

    const { data: links, error: lErr } = await supabaseAdmin
      .from('parent_players')
      .select('player_id, parent_id')
      .in('player_id', playerIds)
      .eq('status', 'approved');
    if (lErr) throw new Error(lErr.message);
    if (!links?.length) return map;

    const parentIds = [...new Set(links.map((l) => String((l as { parent_id: string }).parent_id)))];
    const { data: parents, error: pErr } = await supabaseAdmin
      .from('parents')
      .select('id, user_id')
      .in('id', parentIds)
      .is('deleted_at', null);
    if (pErr) throw new Error(pErr.message);

    const userIds = [...new Set((parents ?? []).map((p) => String((p as { user_id: string }).user_id)))];
    const userById = new Map<string, { email: string; payment_hold: boolean }>();
    if (userIds.length > 0) {
      const { data: users, error: uErr } = await supabaseAdmin
        .from('users')
        .select('id, email, payment_hold')
        .in('id', userIds);
      if (uErr) throw new Error(uErr.message);
      for (const u of users ?? []) {
        const row = u as { id: string; email: string; payment_hold: boolean };
        userById.set(String(row.id), { email: row.email, payment_hold: Boolean(row.payment_hold) });
      }
    }

    const parentUser = new Map(
      (parents ?? []).map((p) => [String((p as { id: string }).id), String((p as { user_id: string }).user_id)]),
    );

    for (const link of links) {
      const l = link as { player_id: string; parent_id: string };
      const uid = parentUser.get(String(l.parent_id));
      if (!uid) continue;
      const u = userById.get(uid);
      if (!u) continue;
      const playerId = String(l.player_id);
      const entry = { user_id: uid, email: u.email, payment_hold: u.payment_hold };
      const list = map.get(playerId) ?? [];
      if (!list.some((x) => x.user_id === entry.user_id)) list.push(entry);
      map.set(playerId, list);
    }
    return map;
  }

  static async updatePlayerFees(
    playerId: string,
    body: UpdatePlayerFeesBody,
    actorId: string,
  ) {
    const { iso: periodMonth } = parsePeriodMonth(body.periodMonth);

    const { data: player, error: pErr } = await supabaseAdmin
      .from('players')
      .select('id')
      .eq('id', playerId)
      .is('deleted_at', null)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!player) throw new NotFoundError('Jugador no encontrado');

    if (body.registrationPaid !== undefined) {
      const { error } = await supabaseAdmin
        .from('players')
        .update({ registration_paid: body.registrationPaid })
        .eq('id', playerId);
      if (error) throw new Error(error.message);
    }

    if (body.monthlyFeePaid !== undefined || body.notes !== undefined) {
      const patch: Record<string, unknown> = {
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      };
      if (body.monthlyFeePaid !== undefined) patch.monthly_fee_paid = body.monthlyFeePaid;
      if (body.notes !== undefined) patch.notes = body.notes;

      const { error: upErr } = await supabaseAdmin
        .from('player_monthly_fees')
        .upsert(
          {
            player_id:    playerId,
            period_month: periodMonth,
            ...patch,
          },
          { onConflict: 'player_id,period_month' },
        );
      if (upErr) throw new Error(upErr.message);
    }

    await FeesService.syncParentsForPlayer(playerId);
    return FeesService.listMatrix(periodMonth);
  }

  /** Recalcula payment_hold de padres vinculados al jugador. */
  static async syncParentsForPlayer(playerId: string) {
    const { data: links, error } = await supabaseAdmin
      .from('parent_players')
      .select('parent_id')
      .eq('player_id', playerId)
      .eq('status', 'approved');
    if (error) throw new Error(error.message);

    const parentIds = [...new Set((links ?? []).map((l) => String((l as { parent_id: string }).parent_id)))];
    for (const parentId of parentIds) {
      await FeesService.syncParentPaymentHold(parentId);
    }
  }

  static async syncParentPaymentHold(parentId: string) {
    const { data: parent, error: pErr } = await supabaseAdmin
      .from('parents')
      .select('user_id')
      .eq('id', parentId)
      .is('deleted_at', null)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!parent?.user_id) return;

    const hold = await FeesService.parentShouldHavePaymentHold(parentId);

    const { error } = await supabaseAdmin
      .from('users')
      .update({ payment_hold: hold })
      .eq('id', parent.user_id);
    if (error) throw new Error(error.message);
  }

  static async parentShouldHavePaymentHold(parentId: string): Promise<boolean> {
    const periodMonth = currentPeriodMonthIso();

    const { data: links, error: lErr } = await supabaseAdmin
      .from('parent_players')
      .select('player_id')
      .eq('parent_id', parentId)
      .eq('status', 'approved');
    if (lErr) throw new Error(lErr.message);

    const playerIds = (links ?? []).map((l) => String((l as { player_id: string }).player_id));
    if (playerIds.length === 0) return false;

    const { data: players, error: pErr } = await supabaseAdmin
      .from('players')
      .select('id, registration_paid')
      .in('id', playerIds)
      .is('deleted_at', null);
    if (pErr) throw new Error(pErr.message);

    const { data: fees, error: fErr } = await supabaseAdmin
      .from('player_monthly_fees')
      .select('player_id, monthly_fee_paid')
      .eq('period_month', periodMonth)
      .in('player_id', playerIds);
    if (fErr) throw new Error(fErr.message);

    const monthlyPaidSet = new Set(
      (fees ?? [])
        .filter((f) => Boolean((f as { monthly_fee_paid: boolean }).monthly_fee_paid))
        .map((f) => String((f as { player_id: string }).player_id)),
    );

    /** Bloqueo solo si algún hijo debe registro y mensualidad a la vez. Una sola deuda = advertencia, no bloqueo. */
    for (const p of players ?? []) {
      const row = p as { id: string; registration_paid: boolean };
      const regPaid = Boolean(row.registration_paid);
      const monthPaid = monthlyPaidSet.has(String(row.id));
      if (!regPaid && !monthPaid) return true;
    }
    return false;
  }

  static async assertParentUserCanLogin(userId: string) {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('payment_hold')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (user?.payment_hold) {
      throw new UnauthorizedError(PARENT_PAYMENT_BLOCKED_MESSAGE);
    }
  }
}
