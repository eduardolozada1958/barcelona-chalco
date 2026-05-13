import { supabaseAdmin } from '@config/database';
import { NotFoundError } from '@middlewares/error.middleware';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import type { ListGalleryQuery, CreateGalleryPostBody, UpdateGalleryPostBody } from './gallery.validation';

export class GalleryService {
  static async listPublic(opts: ListGalleryQuery) {
    let query = supabaseAdmin
      .from('gallery_posts')
      .select('*, gallery_media(*)', { count: 'exact' })
      .eq('is_published', true)
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1
      );

    if (opts.type)   query = query.eq('type', opts.type);
    if (opts.season) query = query.eq('season', opts.season);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: data ?? [], meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit) };
  }

  static async getPublicById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('gallery_posts')
      .select('*, gallery_media(*)')
      .eq('id', id)
      .eq('is_published', true)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundError('Publicación no encontrada');

    const views = typeof data.views_count === 'number' ? data.views_count + 1 : 1;
    await supabaseAdmin.from('gallery_posts').update({ views_count: views }).eq('id', id);

    return { ...data, views_count: views };
  }

  static async listAdmin(opts: ListGalleryQuery) {
    let query = supabaseAdmin
      .from('gallery_posts')
      .select('*, gallery_media(*)', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1
      );

    if (opts.type)   query = query.eq('type', opts.type);
    if (opts.season) query = query.eq('season', opts.season);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: data ?? [], meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit) };
  }

  static async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('gallery_posts')
      .select('*, gallery_media(*)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundError('Publicación no encontrada');
    return data;
  }

  static async create(input: CreateGalleryPostBody, createdBy: string) {
    const { data: post, error } = await supabaseAdmin
      .from('gallery_posts')
      .insert({
        title:              input.title,
        caption:            input.caption ?? null,
        type:               input.type,
        related_match_id:   input.relatedMatchId ?? null,
        related_player_id:  input.relatedPlayerId ?? null,
        is_featured:        input.isFeatured,
        season:             input.season,
        created_by:         createdBy,
      })
      .select()
      .single();

    if (error || !post) throw new Error(error?.message ?? 'Error al crear publicación');

    if (input.media.length > 0) {
      const rows = input.media.map((m, i) => ({
        post_id:         post.id,
        url:             m.url,
        type:            m.type,
        thumbnail_url:   m.thumbnailUrl ?? null,
        caption:         m.caption ?? null,
        sort_order:      m.sortOrder ?? i,
        file_size_bytes: m.fileSizeBytes ?? null,
        width_px:        m.widthPx ?? null,
        height_px:       m.heightPx ?? null,
      }));
      const { error: mErr } = await supabaseAdmin.from('gallery_media').insert(rows);
      if (mErr) throw new Error(mErr.message);
    }

    return GalleryService.getById(post.id);
  }

  static async update(id: string, input: UpdateGalleryPostBody) {
    await GalleryService.getById(id);

    const u: Record<string, unknown> = {};
    if (input.title !== undefined)            u.title               = input.title;
    if (input.caption !== undefined)          u.caption             = input.caption;
    if (input.type !== undefined)             u.type                = input.type;
    if (input.relatedMatchId !== undefined)   u.related_match_id    = input.relatedMatchId;
    if (input.relatedPlayerId !== undefined)  u.related_player_id   = input.relatedPlayerId;
    if (input.isFeatured !== undefined)       u.is_featured         = input.isFeatured;
    if (input.season !== undefined)           u.season              = input.season;

    if (Object.keys(u).length > 0) {
      const { error: upErr } = await supabaseAdmin.from('gallery_posts').update(u).eq('id', id);
      if (upErr) throw new Error(upErr.message);
    }

    if (input.media) {
      const { error: delErr } = await supabaseAdmin.from('gallery_media').delete().eq('post_id', id);
      if (delErr) throw new Error(delErr.message);

      if (input.media.length > 0) {
        const rows = input.media.map((m, i) => ({
          post_id:         id,
          url:             m.url,
          type:            m.type,
          thumbnail_url:   m.thumbnailUrl ?? null,
          caption:         m.caption ?? null,
          sort_order:      m.sortOrder ?? i,
          file_size_bytes: m.fileSizeBytes ?? null,
          width_px:        m.widthPx ?? null,
          height_px:       m.heightPx ?? null,
        }));
        const { error: insErr } = await supabaseAdmin.from('gallery_media').insert(rows);
        if (insErr) throw new Error(insErr.message);
      }
    }

    return GalleryService.getById(id);
  }

  static async publish(id: string) {
    await GalleryService.getById(id);

    const { data, error } = await supabaseAdmin
      .from('gallery_posts')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, gallery_media(*)')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async softDelete(id: string) {
    await GalleryService.getById(id);
    const { error } = await supabaseAdmin
      .from('gallery_posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
