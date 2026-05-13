import { supabaseAdmin } from '@config/database';
import { NotFoundError, BadRequestError } from '@middlewares/error.middleware';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import type { ListNoticesQuery, CreateNoticeBody, UpdateNoticeBody } from './notices.validation';

export class NoticesService {
  static async listPublic(opts: ListNoticesQuery) {
    let query = supabaseAdmin
      .from('notices')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .is('deleted_at', null)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1
      );

    if (opts.type)     query = query.eq('type', opts.type);
    if (opts.audience) query = query.eq('audience', opts.audience);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: data ?? [], meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit) };
  }

  static async getPublicById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('notices')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundError('Aviso no encontrado');
    return data;
  }

  static async listAdmin(opts: ListNoticesQuery) {
    let query = supabaseAdmin
      .from('notices')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1
      );

    if (opts.type)     query = query.eq('type', opts.type);
    if (opts.audience) query = query.eq('audience', opts.audience);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: data ?? [], meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit) };
  }

  static async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('notices')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundError('Aviso no encontrado');
    return data;
  }

  static async create(input: CreateNoticeBody, createdBy: string) {
    if (input.audience === 'specific_category' && !input.targetCategory) {
      throw new BadRequestError('targetCategory es obligatorio para audiencia specific_category');
    }

    const { data, error } = await supabaseAdmin
      .from('notices')
      .insert({
        title:            input.title,
        content:          input.content,
        type:             input.type,
        audience:         input.audience,
        target_category:  input.targetCategory ?? null,
        is_pinned:        input.isPinned,
        cover_image_url:  input.coverImageUrl ?? null,
        expires_at:       input.expiresAt ?? null,
        created_by:       createdBy,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: string, input: UpdateNoticeBody) {
    await NoticesService.getById(id);

    if (input.audience === 'specific_category' && input.targetCategory === undefined) {
      const cur = await NoticesService.getById(id);
      if (!cur.target_category) {
        throw new BadRequestError('targetCategory es obligatorio para audiencia specific_category');
      }
    }

    const u: Record<string, unknown> = {};
    if (input.title !== undefined)           u.title            = input.title;
    if (input.content !== undefined)         u.content          = input.content;
    if (input.type !== undefined)            u.type             = input.type;
    if (input.audience !== undefined)        u.audience         = input.audience;
    if (input.targetCategory !== undefined)  u.target_category  = input.targetCategory;
    if (input.isPinned !== undefined)        u.is_pinned        = input.isPinned;
    if (input.coverImageUrl !== undefined)   u.cover_image_url  = input.coverImageUrl;
    if (input.expiresAt !== undefined)       u.expires_at       = input.expiresAt;

    if (Object.keys(u).length === 0) return NoticesService.getById(id);

    const { data, error } = await supabaseAdmin
      .from('notices')
      .update(u)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async publish(id: string) {
    await NoticesService.getById(id);

    const { data, error } = await supabaseAdmin
      .from('notices')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async softDelete(id: string) {
    await NoticesService.getById(id);
    const { error } = await supabaseAdmin
      .from('notices')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
