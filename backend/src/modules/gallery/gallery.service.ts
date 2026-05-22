import { randomUUID } from 'node:crypto';
import { env } from '@config/env';
import { supabaseAdmin } from '@config/database';
import { WhatsAppService } from '@modules/whatsapp/whatsapp.service';
import { NotFoundError, BadRequestError } from '@middlewares/error.middleware';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import type {
  ListGalleryQuery,
  CreateGalleryPostBody,
  UpdateGalleryPostBody,
  CreateGalleryUploadFields,
} from './gallery.validation';

function extFromImageMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  throw new BadRequestError('La imagen debe ser PNG, JPEG o WebP');
}

function normalizeScheduledAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new BadRequestError('Fecha de publicación programada inválida');
  return d.toISOString();
}

function isFutureSchedule(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now();
}

function storageObjectPathFromGalleryPublicUrl(publicUrl: string): string | null {
  const bucket = env.STORAGE_BUCKET_GALLERY;
  const needle = `/object/public/${bucket}/`;
  const i = publicUrl.indexOf(needle);
  if (i === -1) return null;
  try {
    return decodeURIComponent(publicUrl.slice(i + needle.length));
  } catch {
    return publicUrl.slice(i + needle.length);
  }
}

export class GalleryService {
  static async listPublic(opts: ListGalleryQuery) {
    let query = supabaseAdmin
      .from('gallery_posts')
      .select('*, gallery_media(*)', { count: 'exact' })
      .eq('is_published', true)
      .eq('is_archived', false)
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
      .eq('is_archived', false)
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
      .order('created_at', { ascending: false });

    if (!opts.includeArchived) {
      query = query.eq('is_archived', false);
    }

    query = query
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

  /** Crea publicación y sube imágenes a Storage en un solo paso. */
  static async createWithUpload(
    input: CreateGalleryUploadFields,
    files: Express.Multer.File[],
    createdBy: string,
  ) {
    if (files.length === 0) {
      throw new BadRequestError('Adjunta al menos una imagen');
    }

    const post = await GalleryService.create(
      {
        title:           input.title,
        caption:         input.caption ?? null,
        type:            input.type,
        relatedMatchId:  null,
        relatedPlayerId: null,
        isFeatured:      input.isFeatured ?? false,
        season:          input.season,
        media:           [],
      },
      createdBy,
    );

    const bucket = env.STORAGE_BUCKET_GALLERY;
    const mediaRows: {
      post_id: string;
      url: string;
      type: 'image';
      sort_order: number;
      file_size_bytes: number;
    }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const ext = extFromImageMime(file.mimetype);
      const objectPath = `${post.id}/${randomUUID()}.${ext}`;

      const { error: upErr } = await supabaseAdmin.storage
        .from(bucket)
        .upload(objectPath, file.buffer as Buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
      if (upErr) throw new Error(upErr.message);

      const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(objectPath);
      mediaRows.push({
        post_id:         String(post.id),
        url:             pub.publicUrl,
        type:            'image',
        sort_order:      i,
        file_size_bytes: file.size,
      });
    }

    const { error: mErr } = await supabaseAdmin.from('gallery_media').insert(mediaRows);
    if (mErr) throw new Error(mErr.message);

    const scheduledAt = normalizeScheduledAt(input.scheduledPublishAt ?? null);
    if (scheduledAt) {
      await supabaseAdmin
        .from('gallery_posts')
        .update({ scheduled_publish_at: scheduledAt })
        .eq('id', post.id);
    }

    const shouldPublishNow =
      input.publish && (!scheduledAt || !isFutureSchedule(scheduledAt));

    if (shouldPublishNow) {
      return GalleryService.publish(String(post.id));
    }

    return GalleryService.getById(String(post.id));
  }

  static async addMediaToPost(postId: string, files: Express.Multer.File[]) {
    if (!files.length) {
      throw new BadRequestError('Adjunta al menos una imagen');
    }
    await GalleryService.getById(postId);

    const { data: maxRows, error: maxErr } = await supabaseAdmin
      .from('gallery_media')
      .select('sort_order')
      .eq('post_id', postId)
      .order('sort_order', { ascending: false })
      .limit(1);
    if (maxErr) throw new Error(maxErr.message);
    let sortBase =
      maxRows?.[0] && typeof (maxRows[0] as { sort_order?: number }).sort_order === 'number'
        ? Number((maxRows[0] as { sort_order: number }).sort_order) + 1
        : 0;

    const bucket = env.STORAGE_BUCKET_GALLERY;
    const mediaRows: {
      post_id: string;
      url: string;
      type: 'image';
      sort_order: number;
      file_size_bytes: number;
    }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const ext = extFromImageMime(file.mimetype);
      const objectPath = `${postId}/${randomUUID()}.${ext}`;

      const { error: upErr } = await supabaseAdmin.storage
        .from(bucket)
        .upload(objectPath, file.buffer as Buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
      if (upErr) throw new Error(upErr.message);

      const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(objectPath);
      mediaRows.push({
        post_id:         postId,
        url:             pub.publicUrl,
        type:            'image',
        sort_order:      sortBase + i,
        file_size_bytes: file.size,
      });
    }

    const { error: insErr } = await supabaseAdmin.from('gallery_media').insert(mediaRows);
    if (insErr) throw new Error(insErr.message);

    return GalleryService.getById(postId);
  }

  static async removeMediaItem(postId: string, mediaId: string) {
    await GalleryService.getById(postId);

    const { data: row, error: fErr } = await supabaseAdmin
      .from('gallery_media')
      .select('id, post_id, url')
      .eq('id', mediaId)
      .eq('post_id', postId)
      .single();

    if (fErr || !row) throw new NotFoundError('Imagen no encontrada');

    const objectPath = storageObjectPathFromGalleryPublicUrl(String((row as { url: string }).url));
    if (objectPath) {
      await supabaseAdmin.storage.from(env.STORAGE_BUCKET_GALLERY).remove([objectPath]);
    }

    const { error: dErr } = await supabaseAdmin.from('gallery_media').delete().eq('id', mediaId);
    if (dErr) throw new Error(dErr.message);

    const { count } = await supabaseAdmin
      .from('gallery_media')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId);

    if ((count ?? 0) === 0) {
      throw new BadRequestError('La publicación debe tener al menos una imagen. Sube otra antes de eliminar esta.');
    }

    return GalleryService.getById(postId);
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
    if (input.scheduledPublishAt !== undefined) {
      u.scheduled_publish_at = normalizeScheduledAt(input.scheduledPublishAt);
    }

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
    const cur = await GalleryService.getById(id);
    if (cur.is_archived) {
      throw new BadRequestError('No se puede publicar una publicación archivada. Desarchívala primero.');
    }
    if (cur.is_published) return cur;

    const { count } = await supabaseAdmin
      .from('gallery_media')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', id);
    if ((count ?? 0) === 0) {
      throw new BadRequestError('Agrega al menos una imagen antes de publicar');
    }

    const { data, error } = await supabaseAdmin
      .from('gallery_posts')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
        scheduled_publish_at: null,
      })
      .eq('id', id)
      .select('*, gallery_media(*)')
      .single();

    if (error) throw new Error(error.message);

    if (env.WHATSAPP_ENABLED && env.WHATSAPP_NOTIFY_GALLERY) {
      void WhatsAppService.notifyGalleryPublished({
        id:          String(data.id),
        title:       String(data.title ?? 'Galería'),
        description: data.description ? String(data.description) : null,
      }).catch(() => {});
    }

    return data;
  }

  static async setArchived(id: string, archived: boolean) {
    await GalleryService.getById(id);
    const { data, error } = await supabaseAdmin
      .from('gallery_posts')
      .update({ is_archived: archived })
      .eq('id', id)
      .is('deleted_at', null)
      .select('*, gallery_media(*)')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async schedulePublish(id: string, scheduledPublishAt: string) {
    const at = normalizeScheduledAt(scheduledPublishAt);
    if (!at) throw new BadRequestError('Indica fecha y hora de publicación');

    if (!isFutureSchedule(at)) {
      return GalleryService.publish(id);
    }

    const cur = await GalleryService.getById(id);
    if (cur.is_published) {
      throw new BadRequestError('La publicación ya está visible en la galería');
    }

    const { data, error } = await supabaseAdmin
      .from('gallery_posts')
      .update({ scheduled_publish_at: at })
      .eq('id', id)
      .is('deleted_at', null)
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
