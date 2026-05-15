import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@config/database';
import { env } from '@config/env';
import { NotFoundError, ConflictError, BadRequestError } from '@middlewares/error.middleware';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import type { ListUsersQuery, CreateUserBody, UpdateUserBody } from './users.validation';

const USER_SELECT =
  'id, email, role, status, full_name, avatar_url, phone, last_login_at, email_verified, created_at, updated_at';

export class UsersService {
  static async list(opts: ListUsersQuery) {
    let query = supabaseAdmin
      .from('users')
      .select(USER_SELECT, { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1
      );

    if (opts.role)   query = query.eq('role', opts.role);
    if (opts.status) query = query.eq('status', opts.status);
    if (opts.search) {
      query = query.or(`email.ilike.%${opts.search}%,full_name.ilike.%${opts.search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data,
      meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit),
    };
  }

  static async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(USER_SELECT)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundError('Usuario no encontrado');
    return data;
  }

  static async create(input: CreateUserBody) {
    const email = input.email.toLowerCase();
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle();

    if (existing) throw new ConflictError('El correo ya está registrado');

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        role:          input.role,
        full_name:     input.fullName,
        phone:         input.phone ?? null,
        status:        'active',
        email_verified: true,
      })
      .select(USER_SELECT)
      .single();

    if (error) {
      if (error.code === '23505') throw new ConflictError('El correo ya está registrado');
      throw new Error(error.message);
    }
    return data;
  }

  static async update(id: string, input: UpdateUserBody, actorUserId: string) {
    const current = await UsersService.getById(id);

    if (id === actorUserId && input.role !== undefined && input.role !== current.role) {
      throw new BadRequestError('No puedes cambiar tu propio rol');
    }

    if (id === actorUserId && input.status === 'inactive') {
      throw new BadRequestError('No puedes desactivar tu propia cuenta');
    }

    const updateData: Record<string, unknown> = {};
    if (input.fullName !== undefined)  updateData.full_name  = input.fullName;
    if (input.phone !== undefined)     updateData.phone      = input.phone;
    if (input.status !== undefined)    updateData.status     = input.status;
    if (input.role !== undefined)      updateData.role       = input.role;
    if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;

    if (Object.keys(updateData).length === 0) {
      return UsersService.getById(id);
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select(USER_SELECT)
      .single();

    if (error) {
      if (error.code === '23505') throw new ConflictError('Email duplicado');
      throw new Error(error.message);
    }
    return data;
  }

  static async softDelete(id: string, actorUserId: string) {
    if (id === actorUserId) {
      throw new BadRequestError('No puedes eliminar tu propio usuario');
    }

    await UsersService.getById(id);

    const { error } = await supabaseAdmin
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
