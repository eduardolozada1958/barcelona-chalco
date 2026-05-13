import { supabaseAdmin } from '@config/database';
import { NotFoundError } from '@middlewares/error.middleware';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import type { ListParentsQuery, UpdateParentBody } from './parents.validation';

export class ParentsService {
  static async list(opts: ListParentsQuery) {
    let query = supabaseAdmin
      .from('parents')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('last_name', { ascending: true })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1
      );

    if (opts.search) {
      query = query.or(
        `first_name.ilike.%${opts.search}%,last_name.ilike.%${opts.search}%,phone_primary.ilike.%${opts.search}%`
      );
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

  static async getMyPlayers(userId: string) {
    const { data: parent, error: pErr } = await supabaseAdmin
      .from('parents')
      .select('id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (pErr || !parent) throw new NotFoundError('Perfil de padre no encontrado');

    const { data: links, error } = await supabaseAdmin
      .from('parent_players')
      .select('is_primary_contact, players(*)')
      .eq('parent_id', parent.id);

    if (error) throw new Error(error.message);

    const rows = (links ?? []).map((row: { is_primary_contact: boolean; players: unknown }) => ({
      isPrimaryContact: row.is_primary_contact,
      player:           row.players,
    }));

    return rows;
  }
}
