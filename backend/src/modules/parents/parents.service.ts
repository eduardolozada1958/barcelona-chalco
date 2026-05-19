import { supabaseAdmin } from '@config/database';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '@middlewares/error.middleware';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import { buildIlikeOrFilter } from '@shared/utils/sanitize-search';
import { normalizeCurp } from '@shared/utils/curp';
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
    let query = supabaseAdmin
      .from('parents')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
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

    return { ...parent, user: userRow };
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
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
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
            firstName:    parents.first_name,
            lastName:     parents.last_name,
            relationship: parents.relationship,
          }
        : null,
    };
  }

  static async getMyPlayers(userId: string) {
    const parent = await ParentsService.getParentByUserId(userId);

    const { data: links, error } = await supabaseAdmin
      .from('parent_players')
      .select('is_primary_contact, relationship, status, players(*)')
      .eq('parent_id', parent.id)
      .eq('status', 'approved');

    if (error) throw new Error(error.message);

    return (links ?? []).map((row: Record<string, unknown>) => ({
      isPrimaryContact: row.is_primary_contact,
      relationship:     row.relationship,
      status:           row.status,
      player:           row.players,
    }));
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
        'No encontramos un jugador con esa CURP en la plantilla. Contacta al entrenador o administrador para que registre a tu hijo con su CURP.',
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

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []).map((r) => ParentsService.mapLinkRow(r as Record<string, unknown>)),
      meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit),
    };
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
    return ParentsService.mapLinkRow(data as Record<string, unknown>);
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
}
