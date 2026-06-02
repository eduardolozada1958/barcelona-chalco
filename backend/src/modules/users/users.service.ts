import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@config/database';
import { invalidateCachedUser } from '@shared/utils/user-cache';
import { env } from '@config/env';
import { NotFoundError, ConflictError, BadRequestError } from '@middlewares/error.middleware';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import { buildIlikeOrFilter } from '@shared/utils/sanitize-search';
import { clearLoginLockout, isLoginLocked } from '@modules/auth/login-lockout';
import { EmailChangeService } from '@modules/auth/email-change.service';
import {
  adminSensitiveVerificationRequired,
  SensitiveActionService,
} from '@shared/services/sensitive-action.service';
import type { ListUsersQuery, CreateUserBody, UpdateUserBody } from './users.validation';

const USER_SELECT =
  'id, email, role, status, full_name, avatar_url, phone, last_login_at, email_verified, failed_login_attempts, login_locked_at, payment_hold, created_at, updated_at';

type ParentLinkSummary = {
  approved: number;
  pending: number;
  rejected: number;
  /** Sin ninguna solicitud de vínculo. */
  hasNoLinks: boolean;
};

async function enrichParentLinkSummaries(users: Record<string, unknown>[]) {
  const parentUsers = users.filter((u) => u.role === 'parent');
  if (!parentUsers.length) return users;

  const userIds = parentUsers.map((u) => String(u.id));
  const { data: parents, error: pErr } = await supabaseAdmin
    .from('parents')
    .select('id, user_id')
    .in('user_id', userIds)
    .is('deleted_at', null);
  if (pErr) throw new Error(pErr.message);

  const parentByUser = new Map(
    (parents ?? []).map((p) => [String((p as { user_id: string }).user_id), String((p as { id: string }).id)]),
  );

  const parentIds = [...parentByUser.values()];
  const counts = new Map<string, { approved: number; pending: number; rejected: number }>();

  if (parentIds.length) {
    const { data: links, error: lErr } = await supabaseAdmin
      .from('parent_players')
      .select('parent_id, status')
      .in('parent_id', parentIds);
    if (lErr) throw new Error(lErr.message);

    for (const row of links ?? []) {
      const pid = String((row as { parent_id: string }).parent_id);
      const st = String((row as { status: string }).status);
      const cur = counts.get(pid) ?? { approved: 0, pending: 0, rejected: 0 };
      if (st === 'approved') cur.approved += 1;
      else if (st === 'pending') cur.pending += 1;
      else if (st === 'rejected') cur.rejected += 1;
      counts.set(pid, cur);
    }
  }

  return users.map((u) => {
    if (u.role !== 'parent') return u;
    const parentId = parentByUser.get(String(u.id));
    if (!parentId) {
      return {
        ...u,
        parentLinkSummary: { approved: 0, pending: 0, rejected: 0, hasNoLinks: true } satisfies ParentLinkSummary,
      };
    }
    const c = counts.get(parentId) ?? { approved: 0, pending: 0, rejected: 0 };
    const total = c.approved + c.pending + c.rejected;
    return {
      ...u,
      parentLinkSummary: {
        ...c,
        hasNoLinks: total === 0,
      } satisfies ParentLinkSummary,
    };
  });
}

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
      const filter = buildIlikeOrFilter(['email', 'full_name'], opts.search);
      if (filter) query = query.or(filter);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const enriched = await enrichParentLinkSummaries((data ?? []) as Record<string, unknown>[]);

    return {
      data: enriched,
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
    invalidateCachedUser(id);
    return data;
  }

  static async requestEmailChange(
    id: string,
    actorUserId: string,
    _actorEmail: string,
    newEmail: string,
    verificationCode?: string,
  ) {
    await UsersService.getById(id);

    if (adminSensitiveVerificationRequired()) {
      if (!verificationCode?.trim()) {
        throw new BadRequestError(
          'Se requiere código de verificación enviado a tu correo de administrador.',
        );
      }
      await SensitiveActionService.verifyCode(
        actorUserId,
        'change_user_email',
        verificationCode,
        id,
      );
    }

    return EmailChangeService.requestByAdmin(actorUserId, id, newEmail);
  }

  static async sendEmailChangeVerificationCode(targetUserId: string, actorUserId: string, actorEmail: string) {
    await UsersService.getById(targetUserId);
    await SensitiveActionService.sendCode(actorUserId, actorEmail, 'change_user_email', targetUserId);
  }

  static async unlockLogin(id: string, actorUserId: string) {
    const user = await UsersService.getById(id);

    if (!isLoginLocked(user)) {
      throw new BadRequestError('Esta cuenta no está bloqueada por intentos de login');
    }

    if (id === actorUserId) {
      throw new BadRequestError(
        'No puedes desbloquearte desde aquí si no tienes sesión. Usa «Olvidé mi contraseña» o pide a otro administrador.',
      );
    }

    await clearLoginLockout(id);
    return UsersService.getById(id);
  }

  static async sendDeleteVerificationCode(targetUserId: string, actorUserId: string, actorEmail: string) {
    await UsersService.getById(targetUserId);
    await SensitiveActionService.sendCode(actorUserId, actorEmail, 'delete_user', targetUserId);
  }

  static async softDelete(
    id: string,
    actorUserId: string,
    _actorEmail: string,
    verificationCode?: string,
  ) {
    if (id === actorUserId) {
      throw new BadRequestError('No puedes eliminar tu propio usuario');
    }

    const user = await UsersService.getById(id);

    if (adminSensitiveVerificationRequired()) {
      if (!verificationCode?.trim()) {
        throw new BadRequestError(
          'Se requiere código de verificación enviado a tu correo de administrador. Solicítalo antes de eliminar.',
        );
      }
      await SensitiveActionService.verifyCode(actorUserId, 'delete_user', verificationCode, id);
    }

    const now = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('users')
      .update({ deleted_at: now })
      .eq('id', id);

    if (error) throw new Error(error.message);

    if (user.role === 'parent') {
      const { data: parentRow } = await supabaseAdmin
        .from('parents')
        .select('id')
        .eq('user_id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (parentRow?.id) {
        const parentId = String(parentRow.id);
        await supabaseAdmin
          .from('parents')
          .update({ deleted_at: now })
          .eq('id', parentId);

        await supabaseAdmin
          .from('parent_players')
          .update({
            status:         'rejected',
            reject_reason:  'Cuenta de padre/tutor eliminada por administración',
            reviewed_at:    now,
            reviewed_by:    actorUserId,
          })
          .eq('parent_id', parentId)
          .in('status', ['pending', 'approved']);
      }
    }
  }
}
