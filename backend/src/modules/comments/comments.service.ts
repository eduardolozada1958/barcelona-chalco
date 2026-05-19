import { supabaseAdmin } from '@config/database';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@middlewares/error.middleware';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import type {
  AdminListCommentsQuery,
  CreateCommentBody,
  ListCommentsQuery,
  RejectCommentBody,
} from './comments.validation';

type CommentStatus = 'pending' | 'approved' | 'rejected';

/** FK explícita: hay dos referencias comments → users (user_id y reviewed_by). */
const COMMENT_SELECT = `
  id,
  resource_type,
  resource_id,
  user_id,
  content,
  status,
  created_at,
  reviewed_at,
  reject_reason,
  author:users!comments_user_id_fkey (
    id,
    full_name,
    role,
    avatar_url
  )
`;

function mapCommentRow(row: Record<string, unknown>) {
  const user = row.author as Record<string, unknown> | null;
  return {
    id:           row.id,
    resourceType: row.resource_type,
    resourceId:   row.resource_id,
    userId:       row.user_id,
    content:      row.content,
    status:       row.status,
    createdAt:    row.created_at,
    reviewedAt:   row.reviewed_at ?? null,
    rejectReason: row.reject_reason ?? null,
    author: user
      ? {
          id:        user.id,
          fullName:  user.full_name,
          role:      user.role,
          avatarUrl: user.avatar_url ?? null,
        }
      : null,
  };
}

async function ensureResourceExists(resourceType: string, resourceId: string): Promise<void> {
  const table = resourceType === 'notice' ? 'notices' : 'gallery_posts';
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('id, deleted_at')
    .eq('id', resourceId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || data.deleted_at) {
    throw new NotFoundError('Recurso no encontrado');
  }
}

async function getUserOrThrow(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, role, status, email_verified')
    .eq('id', userId)
    .is('deleted_at', null)
    .single();

  if (error || !data) throw new UnauthorizedError('Usuario no encontrado');
  return data as { id: string; role: string; status: string; email_verified: boolean };
}

export class CommentsService {
  static async listPublic(opts: ListCommentsQuery) {
    await ensureResourceExists(opts.resourceType, opts.resourceId);

    const offset = getPaginationOffset(opts.page, opts.limit);
    const { data, error, count } = await supabaseAdmin
      .from('comments')
      .select(COMMENT_SELECT, { count: 'exact' })
      .eq('resource_type', opts.resourceType)
      .eq('resource_id', opts.resourceId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + opts.limit - 1);

    if (error) throw new Error(error.message);

    return {
      data: (data ?? []).map((r) => mapCommentRow(r as Record<string, unknown>)),
      meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit),
    };
  }

  /** Comentarios del usuario actual sobre un recurso (incluye pendientes/rechazados propios). */
  static async listMineForResource(userId: string, opts: ListCommentsQuery) {
    const { data, error } = await supabaseAdmin
      .from('comments')
      .select(COMMENT_SELECT)
      .eq('resource_type', opts.resourceType)
      .eq('resource_id', opts.resourceId)
      .eq('user_id', userId)
      .in('status', ['pending', 'rejected'])
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => mapCommentRow(r as Record<string, unknown>));
  }

  static async listAdmin(opts: AdminListCommentsQuery) {
    let query = supabaseAdmin
      .from('comments')
      .select(COMMENT_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1,
      );

    if (opts.status && opts.status !== 'all') {
      query = query.eq('status', opts.status);
    }
    if (opts.resourceType) {
      query = query.eq('resource_type', opts.resourceType);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []).map((r) => mapCommentRow(r as Record<string, unknown>)),
      meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit),
    };
  }

  static async create(userId: string, input: CreateCommentBody) {
    const user = await getUserOrThrow(userId);

    if (user.status !== 'active') {
      throw new ForbiddenError('Tu cuenta no está activa.');
    }
    if (user.role === 'parent' && !user.email_verified) {
      throw new ForbiddenError('Verifica tu correo antes de comentar.');
    }

    await ensureResourceExists(input.resourceType, input.resourceId);

    // Cualquier usuario autenticado y verificado publica al instante.
    const status: CommentStatus = 'approved';
    const now = new Date().toISOString();

    const insert = {
      resource_type: input.resourceType,
      resource_id:   input.resourceId,
      user_id:       userId,
      content:       input.content.trim(),
      status,
      reviewed_at:   now,
      reviewed_by:   userId,
    };

    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert(insert)
      .select(COMMENT_SELECT)
      .single();

    if (error) throw new Error(error.message);
    return mapCommentRow(data as Record<string, unknown>);
  }

  private static async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('comments')
      .select(COMMENT_SELECT)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundError('Comentario no encontrado');
    return data as Record<string, unknown>;
  }

  static async approve(id: string, reviewerUserId: string) {
    const row = await CommentsService.getById(id);
    if (row.status === 'approved') return mapCommentRow(row);

    const { data, error } = await supabaseAdmin
      .from('comments')
      .update({
        status:        'approved',
        reviewed_at:   new Date().toISOString(),
        reviewed_by:   reviewerUserId,
        reject_reason: null,
      })
      .eq('id', id)
      .select(COMMENT_SELECT)
      .single();

    if (error) throw new Error(error.message);
    return mapCommentRow(data as Record<string, unknown>);
  }

  static async reject(id: string, reviewerUserId: string, body: RejectCommentBody) {
    const row = await CommentsService.getById(id);
    if (row.status === 'rejected') return mapCommentRow(row);

    const { data, error } = await supabaseAdmin
      .from('comments')
      .update({
        status:        'rejected',
        reviewed_at:   new Date().toISOString(),
        reviewed_by:   reviewerUserId,
        reject_reason: body.reason?.trim() || null,
      })
      .eq('id', id)
      .select(COMMENT_SELECT)
      .single();

    if (error) throw new Error(error.message);
    return mapCommentRow(data as Record<string, unknown>);
  }

  static async remove(id: string, requesterUserId: string, requesterRole: string) {
    const row = await CommentsService.getById(id);
    const isAuthor = row.user_id === requesterUserId;
    const isAdminOrCoach = requesterRole === 'admin' || requesterRole === 'coach';

    if (!isAuthor && !isAdminOrCoach) {
      throw new ForbiddenError('No puedes eliminar este comentario.');
    }

    const { error } = await supabaseAdmin.from('comments').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  static async pendingCount(): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw new Error(error.message);
    return count ?? 0;
  }
}
