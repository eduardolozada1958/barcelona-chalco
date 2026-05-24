import { supabaseAdmin } from '@config/database';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '@middlewares/error.middleware';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import { buildIlikeOrFilter } from '@shared/utils/sanitize-search';
import { normalizeCurp } from '@shared/utils/curp';
import {
  COACH_DISPLAY_NAME,
  COACH_PHONE_DISPLAY,
  COACH_WHATSAPP_URL,
} from '@config/coach-contact';
import {
  currentPeriodMonthIso,
  parsePeriodMonth,
  sessionDatesInMonth,
} from '@shared/utils/attendance-calendar';
import { phoneToWhatsAppJid } from '@modules/whatsapp/phone';
import { maskEmail, maskPhone } from '@shared/utils/mask-contact';
import { logger } from '@shared/utils/logger';
import type {
  CreateLinkRequestInput,
  ListLinkRequestsQuery,
  ListParentsQuery,
  RejectLinkRequestInput,
  UpdateParentBody,
} from './parents.validation';

type LinkStatus = 'pending' | 'approved' | 'rejected';

type ParentRow = { id: string; user_id: string; first_name: string; last_name: string };

const LINK_SELECT = `
  id,
  parent_id,
  player_id,
  is_primary_contact,
  relationship,
  status,
  requested_at,
  reviewed_at,
  reviewed_by,
  reject_reason,
  players (
    id,
    first_name,
    last_name,
    category,
    slug,
    status
  ),
  parents (
    id,
    first_name,
    last_name,
    relationship,
    user_id
  )
`;

export class ParentsService {
  static async list(opts: ListParentsQuery) {
    const { data: activeUsers, error: uErr } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'parent')
      .is('deleted_at', null);
    if (uErr) throw new Error(uErr.message);
    const activeUserIds = (activeUsers ?? []).map((u) => String((u as { id: string }).id));
    if (activeUserIds.length === 0) {
      return { data: [], meta: buildPaginationMeta(0, opts.page, opts.limit) };
    }

    let query = supabaseAdmin
      .from('parents')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .in('user_id', activeUserIds)
      .order('last_name', { ascending: true })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1,
      );

    if (opts.search) {
      const filter = buildIlikeOrFilter(
        ['first_name', 'last_name', 'phone_primary'],
        opts.search,
      );
      if (filter) query = query.or(filter);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data,
      meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit),
    };
  }

  static async getById(id: string) {
    const { data: parent, error } = await supabaseAdmin
      .from('parents')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !parent) throw new NotFoundError('Padre/tutor no encontrado');

    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id, email, role, status, full_name, phone')
      .eq('id', parent.user_id)
      .is('deleted_at', null)
      .single();

    return ParentsService.maskParentContact(parent, userRow);
  }

  private static maskParentContact(
    parent: Record<string, unknown>,
    user: Record<string, unknown> | null,
  ) {
    return {
      ...parent,
      phone_primary:   maskPhone(String(parent.phone_primary ?? '')),
      phone_secondary: parent.phone_secondary ? maskPhone(String(parent.phone_secondary)) : null,
      emergency_contact_phone: parent.emergency_contact_phone
        ? maskPhone(String(parent.emergency_contact_phone))
        : null,
      user: user
        ? {
            ...user,
            email: maskEmail(String(user.email ?? '')),
            phone: user.phone ? maskPhone(String(user.phone)) : null,
          }
        : null,
      contact_masked: true,
    };
  }

  static async update(id: string, input: UpdateParentBody) {
    await ParentsService.getById(id);

    const updateData: Record<string, unknown> = {};
    if (input.firstName !== undefined)             updateData.first_name              = input.firstName;
    if (input.lastName !== undefined)              updateData.last_name               = input.lastName;
    if (input.phonePrimary !== undefined)          updateData.phone_primary           = input.phonePrimary;
    if (input.phoneSecondary !== undefined)        updateData.phone_secondary         = input.phoneSecondary;
    if (input.relationship !== undefined)          updateData.relationship            = input.relationship;
    if (input.occupation !== undefined)            updateData.occupation              = input.occupation;
    if (input.emergencyContactName !== undefined)  updateData.emergency_contact_name  = input.emergencyContactName;
    if (input.emergencyContactPhone !== undefined) updateData.emergency_contact_phone = input.emergencyContactPhone;
    if (input.notes !== undefined)                 updateData.notes                   = input.notes;

    if (Object.keys(updateData).length === 0) {
      return ParentsService.getById(id);
    }

    const { data, error } = await supabaseAdmin
      .from('parents')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    if (input.phonePrimary !== undefined) {
      await supabaseAdmin
        .from('users')
        .update({ phone: String(input.phonePrimary).trim() || null })
        .eq('id', data.user_id)
        .is('deleted_at', null);
    }

    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id, email, role, status, full_name, phone')
      .eq('id', data.user_id)
      .is('deleted_at', null)
      .single();

    return { ...data, user: userRow };
  }

  private static async getParentByUserId(userId: string): Promise<ParentRow> {
    const { data: parent, error } = await supabaseAdmin
      .from('parents')
      .select('id, user_id, first_name, last_name')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !parent) throw new NotFoundError('Perfil de padre no encontrado');
    return parent;
  }

  private static async findPlayerByCurp(curp: string) {
    const normalized = normalizeCurp(curp);
    const { data, error } = await supabaseAdmin
      .from('players')
      .select('id, first_name, last_name, category, slug, curp')
      .eq('curp', normalized)
      .is('deleted_at', null)
      .limit(2);

    if (error) throw new Error(error.message);
    const rows = data ?? [];
    if (rows.length > 1) {
      throw new ConflictError(
        'Hay más de un jugador con esa CURP en el sistema. Contacta al administrador para corregir el duplicado.',
      );
    }
    return rows[0] ?? null;
  }

  private static mapLinkRow(row: Record<string, unknown>) {
    const players = row.players as Record<string, unknown> | null;
    const parents = row.parents as Record<string, unknown> | null;

    return {
      id:               row.id,
      parentId:         row.parent_id,
      playerId:         row.player_id,
      isPrimaryContact: row.is_primary_contact,
      relationship:     row.relationship,
      status:           row.status,
      requestedAt:      row.requested_at,
      reviewedAt:       row.reviewed_at,
      rejectReason:     row.reject_reason,
      player: players
        ? {
            id:        players.id,
            firstName: players.first_name,
            lastName:  players.last_name,
            category:  players.category,
            slug:      players.slug,
          }
        : null,
      parent: parents
        ? {
            id:           parents.id,
            userId:       parents.user_id,
            firstName:    parents.first_name,
            lastName:     parents.last_name,
            relationship: parents.relationship,
          }
        : null,
    };
  }

  static async getMyPlayers(userId: string) {
    const parent = await ParentsService.getParentByUserId(userId);

    const playerCols =
      'id, slug, first_name, last_name, category, avatar_url, jersey_number, position, dominant_foot, is_verified, qr_generated_at, qr_token';

    const { data: links, error } = await supabaseAdmin
      .from('parent_players')
      .select(`is_primary_contact, relationship, status, players(${playerCols})`)
      .eq('parent_id', parent.id)
      .eq('status', 'approved');

    if (error) throw new Error(error.message);

    return (links ?? []).map((row: Record<string, unknown>) => {
      const raw = row.players as Record<string, unknown> | null;
      let player: Record<string, unknown> | null = raw;
      if (raw) {
        const { qr_token: token, ...rest } = raw;
        player = {
          ...rest,
          has_qr: Boolean(token),
          qr_token: token ?? null,
          ...(token
            ? { credential_ar_url: `/credencial-ar/${encodeURIComponent(String(token))}` }
            : {}),
        };
      }
      return {
        isPrimaryContact: row.is_primary_contact,
        relationship:     row.relationship,
        status:           row.status,
        player,
      };
    });
  }

  static async getMyLinkRequests(userId: string) {
    const parent = await ParentsService.getParentByUserId(userId);

    const { data, error } = await supabaseAdmin
      .from('parent_players')
      .select('id, parent_id, player_id, is_primary_contact, relationship, status, requested_at, reviewed_at, reject_reason, players(id, first_name, last_name, category, slug)')
      .eq('parent_id', parent.id)
      .in('status', ['pending', 'rejected'])
      .order('requested_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ParentsService.mapLinkRow(row as Record<string, unknown>));
  }

  static async createLinkRequest(userId: string, input: CreateLinkRequestInput) {
    const parent = await ParentsService.getParentByUserId(userId);

    const player = await ParentsService.findPlayerByCurp(input.curp);
    if (!player) {
      throw new NotFoundError(
        'No se pudo vincular con esa CURP. Verifica que esté correcta o contacta al entrenador para registrar a tu hijo.',
      );
    }

    const { data: existing, error: exErr } = await supabaseAdmin
      .from('parent_players')
      .select('id, status')
      .eq('parent_id', parent.id)
      .eq('player_id', player.id)
      .maybeSingle();

    if (exErr) throw new Error(exErr.message);

    if (existing?.status === 'approved') {
      throw new ConflictError('Este jugador ya está vinculado a tu cuenta.');
    }
    if (existing?.status === 'pending') {
      throw new ConflictError('Ya tienes una solicitud pendiente para este jugador.');
    }

    const now = new Date().toISOString();
    const row = {
      parent_id:          parent.id,
      player_id:          player.id,
      is_primary_contact: input.isPrimaryContact,
      relationship:       input.relationship,
      status:             'pending' as const,
      requested_at:       now,
      reviewed_at:        null,
      reviewed_by:        null,
      reject_reason:      null,
    };

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('parent_players')
        .update(row)
        .eq('id', existing.id)
        .select(LINK_SELECT)
        .single();

      if (error) throw new Error(error.message);
      return ParentsService.mapLinkRow(data as Record<string, unknown>);
    }

    const { data, error } = await supabaseAdmin
      .from('parent_players')
      .insert(row)
      .select(LINK_SELECT)
      .single();

    if (error) throw new Error(error.message);
    return ParentsService.mapLinkRow(data as Record<string, unknown>);
  }

  static async listLinkRequests(opts: ListLinkRequestsQuery) {
    let query = supabaseAdmin
      .from('parent_players')
      .select(LINK_SELECT, { count: 'exact' })
      .order('requested_at', { ascending: false })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1,
      );

    if (opts.status && opts.status !== 'all') {
      query = query.eq('status', opts.status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const filtered = await ParentsService.filterLinksWithActiveParentUser(data ?? []);

    return {
      data: filtered.map((r) => ParentsService.mapLinkRow(r as Record<string, unknown>)),
      meta: buildPaginationMeta(filtered.length, opts.page, opts.limit),
    };
  }

  /** Oculta vínculos cuyo padre ya fue eliminado como usuario. */
  private static async filterLinksWithActiveParentUser(rows: unknown[]) {
    if (!rows.length) return [];
    const userIds = [
      ...new Set(
        rows
          .map((r) => {
            const parents = (r as Record<string, unknown>).parents as Record<string, unknown> | null;
            return parents?.user_id != null ? String(parents.user_id) : null;
          })
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (!userIds.length) return rows;

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, deleted_at')
      .in('id', userIds);
    if (error) throw new Error(error.message);

    const active = new Set(
      (users ?? [])
        .filter((u) => !(u as { deleted_at?: string | null }).deleted_at)
        .map((u) => String((u as { id: string }).id)),
    );

    return rows.filter((r) => {
      const parents = (r as Record<string, unknown>).parents as Record<string, unknown> | null;
      const uid = parents?.user_id != null ? String(parents.user_id) : '';
      return uid && active.has(uid);
    });
  }

  private static async getLinkRequestById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('parent_players')
      .select(LINK_SELECT)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundError('Solicitud no encontrada');
    return data as Record<string, unknown>;
  }

  static async approveLinkRequest(linkId: string, reviewerUserId: string) {
    const row = await ParentsService.getLinkRequestById(linkId);
    const status = row.status as LinkStatus;

    if (status === 'approved') {
      throw new ConflictError('Esta solicitud ya fue aprobada.');
    }
    if (status !== 'pending') {
      throw new BadRequestError('Solo se pueden aprobar solicitudes pendientes.');
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('parent_players')
      .update({
        status:       'approved',
        reviewed_at:  now,
        reviewed_by:  reviewerUserId,
        reject_reason: null,
      })
      .eq('id', linkId)
      .select(LINK_SELECT)
      .single();

    if (error) throw new Error(error.message);
    const mapped = ParentsService.mapLinkRow(data as Record<string, unknown>);
    const parentUserId = (() => {
      const parents = row.parents as Record<string, unknown> | null | undefined;
      if (parents?.user_id) return String(parents.user_id);
      return null;
    })();
    if (parentUserId) {
      void ParentsService.tryAutoEnableWhatsAppNotify(parentUserId);
    }
    return mapped;
  }

  static async rejectLinkRequest(
    linkId: string,
    reviewerUserId: string,
    input: RejectLinkRequestInput,
  ) {
    const row = await ParentsService.getLinkRequestById(linkId);
    const status = row.status as LinkStatus;

    if (status === 'rejected') {
      throw new ConflictError('Esta solicitud ya fue rechazada.');
    }
    if (status !== 'pending') {
      throw new BadRequestError('Solo se pueden rechazar solicitudes pendientes.');
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('parent_players')
      .update({
        status:        'rejected',
        reviewed_at:   now,
        reviewed_by:   reviewerUserId,
        reject_reason: input.reason?.trim() || null,
      })
      .eq('id', linkId)
      .select(LINK_SELECT)
      .single();

    if (error) throw new Error(error.message);
    return ParentsService.mapLinkRow(data as Record<string, unknown>);
  }

  /** Revoca un vínculo ya aprobado (el padre deja de ver al jugador). */
  static async revokeLinkRequest(
    linkId: string,
    reviewerUserId: string,
    input: RejectLinkRequestInput = {},
  ) {
    const row = await ParentsService.getLinkRequestById(linkId);
    const status = row.status as LinkStatus;

    if (status !== 'approved') {
      throw new BadRequestError('Solo se pueden revocar vínculos aprobados.');
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('parent_players')
      .update({
        status:        'rejected',
        reviewed_at:   now,
        reviewed_by:   reviewerUserId,
        reject_reason: input.reason?.trim() || 'Vínculo revocado por administración',
      })
      .eq('id', linkId)
      .select(LINK_SELECT)
      .single();

    if (error) throw new Error(error.message);
    return ParentsService.mapLinkRow(data as Record<string, unknown>);
  }

  static async tryAutoEnableWhatsAppNotify(userId: string): Promise<void> {
    try {
      const parent = await ParentsService.getParentByUserId(userId);
      const check = await ParentsService.isParentEligibleForWhatsApp(parent.id, userId);
      if (!check.eligible) return;

      const { data: row } = await supabaseAdmin
        .from('parents')
        .select('whatsapp_notify_enabled')
        .eq('id', parent.id)
        .maybeSingle();

      if (row?.whatsapp_notify_enabled) return;

      await supabaseAdmin
        .from('parents')
        .update({
          whatsapp_notify_enabled: true,
          whatsapp_notify_at:      new Date().toISOString(),
        })
        .eq('id', parent.id);

      logger.info('WhatsApp: avisos activados automáticamente para padre elegible', {
        userId,
        parentId: parent.id,
      });
    } catch (e) {
      logger.warn('WhatsApp: no se pudo auto-activar avisos', { userId, err: e });
    }
  }

  static async isParentEligibleForWhatsApp(parentId: string, userId: string): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    const { data: userRow, error: uErr } = await supabaseAdmin
      .from('users')
      .select('status, email_verified, role')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();
    if (uErr || !userRow) return { eligible: false, reason: 'Usuario no encontrado' };
    if (userRow.role !== 'parent' || userRow.status !== 'active') {
      return { eligible: false, reason: 'Cuenta no activa como padre/tutor' };
    }
    if (!userRow.email_verified) {
      return { eligible: false, reason: 'Verifica tu correo antes de activar WhatsApp' };
    }

    const { data: parentRow } = await supabaseAdmin
      .from('parents')
      .select('phone_primary')
      .eq('id', parentId)
      .is('deleted_at', null)
      .single();

    const { data: userPhoneRow } = await supabaseAdmin
      .from('users')
      .select('phone')
      .eq('id', userId)
      .single();

    const phone = String(userPhoneRow?.phone ?? '').trim()
      || String(parentRow?.phone_primary ?? '').trim();
    if (!phoneToWhatsAppJid(phone)) {
      return { eligible: false, reason: 'Agrega un teléfono válido en Mi perfil (10 dígitos, ej. 33 4942 0820)' };
    }

    const { count } = await supabaseAdmin
      .from('parent_players')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', parentId)
      .eq('status', 'approved');

    if (!count || count < 1) {
      return { eligible: false, reason: 'Necesitas al menos un hijo vinculado y aprobado' };
    }

    return { eligible: true };
  }

  static async setMyWhatsAppNotify(userId: string, enabled: boolean) {
    const parent = await ParentsService.getParentByUserId(userId);
    const check = await ParentsService.isParentEligibleForWhatsApp(parent.id, userId);
    if (enabled && !check.eligible) {
      throw new BadRequestError(check.reason ?? 'No puedes activar WhatsApp aún');
    }

    const { data, error } = await supabaseAdmin
      .from('parents')
      .update({
        whatsapp_notify_enabled: enabled,
        whatsapp_notify_at:      new Date().toISOString(),
      })
      .eq('id', parent.id)
      .select('whatsapp_notify_enabled, whatsapp_notify_at')
      .single();

    if (error) throw new Error(error.message);
    return {
      enabled: Boolean(data?.whatsapp_notify_enabled),
      enabledAt: data?.whatsapp_notify_at ?? null,
      eligible: check.eligible,
      eligibilityReason: check.reason ?? null,
    };
  }

  /** Resumen privado para el padre: cuotas de sus hijos y asistencia del mes (sin datos de otros familias). */
  static async getMyAccountSummary(userId: string) {
    const parent = await ParentsService.getParentByUserId(userId);
    const waCheck = await ParentsService.isParentEligibleForWhatsApp(parent.id, userId);
    const { data: waRow } = await supabaseAdmin
      .from('parents')
      .select('whatsapp_notify_enabled')
      .eq('id', parent.id)
      .single();
    const periodMonth = currentPeriodMonthIso();
    const { year, month } = parsePeriodMonth(periodMonth);
    const sessionDates = sessionDatesInMonth(year, month);
    const sessionDateList = sessionDates.map((d) => d.date);

    const { data: userRow, error: uErr } = await supabaseAdmin
      .from('users')
      .select('payment_hold')
      .eq('id', userId)
      .single();
    if (uErr) throw new Error(uErr.message);

    const { data: links, error: lErr } = await supabaseAdmin
      .from('parent_players')
      .select('player_id, players(id, first_name, last_name, registration_paid)')
      .eq('parent_id', parent.id)
      .eq('status', 'approved');
    if (lErr) throw new Error(lErr.message);

    const children: {
      playerId: string;
      firstName: string;
      lastName: string;
      registrationPaid: boolean;
      monthlyFeePaid: boolean;
      attendancePresent: number;
      attendanceTotal: number;
      allPaid: boolean;
    }[] = [];

    for (const link of links ?? []) {
      const row = link as Record<string, unknown>;
      const p = row.players as Record<string, unknown> | null;
      if (!p?.id) continue;
      const playerId = String(p.id);
      const registrationPaid = Boolean(p.registration_paid);

      const { data: feeRow } = await supabaseAdmin
        .from('player_monthly_fees')
        .select('monthly_fee_paid')
        .eq('player_id', playerId)
        .eq('period_month', periodMonth)
        .maybeSingle();
      const monthlyFeePaid = Boolean(
        (feeRow as { monthly_fee_paid?: boolean } | null)?.monthly_fee_paid,
      );

      let attendancePresent = 0;
      if (sessionDateList.length > 0) {
        const { data: attRows, error: aErr } = await supabaseAdmin
          .from('attendance_records')
          .select('attendance_date, present')
          .eq('player_id', playerId)
          .in('attendance_date', sessionDateList)
          .eq('present', true);
        if (aErr) throw new Error(aErr.message);
        attendancePresent = attRows?.length ?? 0;
      }

      children.push({
        playerId,
        firstName:         String(p.first_name ?? ''),
        lastName:          String(p.last_name ?? ''),
        registrationPaid,
        monthlyFeePaid,
        attendancePresent,
        attendanceTotal:   sessionDateList.length,
        allPaid:           registrationPaid && monthlyFeePaid,
      });
    }

    const paymentHold = Boolean(userRow?.payment_hold);
    const paymentWarning =
      !paymentHold &&
      children.some(
        (c) =>
          (!c.registrationPaid && c.monthlyFeePaid) ||
          (c.registrationPaid && !c.monthlyFeePaid),
      );

    return {
      paymentHold,
      paymentWarning,
      periodMonth,
      coach: {
        name:     COACH_DISPLAY_NAME,
        phone:    COACH_PHONE_DISPLAY,
        whatsapp: COACH_WHATSAPP_URL,
      },
      whatsapp: {
        enabled:           Boolean(waRow?.whatsapp_notify_enabled),
        eligible:          waCheck.eligible,
        eligibilityReason: waCheck.reason ?? null,
      },
      children,
    };
  }
}
