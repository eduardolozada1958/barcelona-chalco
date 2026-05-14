import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '@config/database';
import { env } from '@config/env';
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from '@middlewares/error.middleware';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import { CURRENT_SEASON } from '@config/constants';
import type { CreatePlayerInput, CreatePlayerMultipartInput, UpdatePlayerInput } from './players.validation';
import type { UserRole } from '@shared/types';

/** Columnas en APIs públicas (sin `curp` completo). */
const PUBLIC_PLAYER_COLUMNS =
  'id, first_name, last_name, birth_date, nationality, position, secondary_position, jersey_number, dominant_foot, height_cm, weight_kg, category, sport_description, avatar_url, status, is_verified, verified_at, verified_by, qr_token, qr_generated_at, season, achievements, notes, created_at, updated_at';

function extFromPhotoMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  throw new BadRequestError('La foto debe ser PNG, JPEG o WebP');
}

function isPdfBuffer(buf: Buffer): boolean {
  return buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === '%PDF';
}

interface ListOptions {
  page:        number;
  limit:       number;
  category?:   string;
  status?:     string;
  search?:     string;
  season?:     string;
  isVerified?: boolean;
}

export class PlayersService {
  static async list(opts: ListOptions) {
    let query = supabaseAdmin
      .from('players')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('last_name', { ascending: true })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1
      );

    if (opts.category)             query = query.eq('category', opts.category);
    if (opts.status)               query = query.eq('status', opts.status);
    if (opts.season)               query = query.eq('season', opts.season);
    if (opts.isVerified !== undefined) query = query.eq('is_verified', opts.isVerified);
    if (opts.search) {
      query = query.or(
        `first_name.ilike.%${opts.search}%,last_name.ilike.%${opts.search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data,
      meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit),
    };
  }

  static async listPublic(opts: Omit<ListOptions, 'status' | 'isVerified' | 'season'>) {
    let query = supabaseAdmin
      .from('players')
      .select(PUBLIC_PLAYER_COLUMNS, { count: 'exact' })
      .eq('status', 'active')
      .eq('is_verified', true)
      .is('deleted_at', null)
      .order('last_name', { ascending: true })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1
      );

    if (opts.category) query = query.eq('category', opts.category);
    if (opts.search) {
      query = query.or(
        `first_name.ilike.%${opts.search}%,last_name.ilike.%${opts.search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: data ?? [],
      meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit),
    };
  }

  static async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('players')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundError('Jugador no encontrado');
    return data;
  }

  static async getPublicProfile(id: string) {
    const { data, error } = await supabaseAdmin
      .from('players')
      .select(PUBLIC_PLAYER_COLUMNS)
      .eq('id', id)
      .eq('is_verified', true)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundError('Jugador no encontrado');
    return data;
  }

  static async create(input: CreatePlayerInput) {
    // Verificar número de camiseta único por categoría
    if (input.jerseyNumber) {
      const { data: existing } = await supabaseAdmin
        .from('players')
        .select('id')
        .eq('category', input.category)
        .eq('jersey_number', input.jerseyNumber)
        .is('deleted_at', null)
        .single();

      if (existing) {
        throw new ConflictError(
          `El número de camiseta ${input.jerseyNumber} ya está en uso en la categoría ${input.category}`
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from('players')
      .insert({
        first_name:         input.firstName,
        last_name:          input.lastName,
        birth_date:         input.birthDate,
        nationality:        input.nationality,
        position:           input.position,
        secondary_position: input.secondaryPosition ?? null,
        jersey_number:      input.jerseyNumber ?? null,
        dominant_foot:      input.dominantFoot,
        height_cm:          input.heightCm ?? null,
        weight_kg:          input.weightKg ?? null,
        category:           input.category,
        sport_description:  input.sportDescription ?? null,
        avatar_url:         input.avatarUrl ?? null,
        achievements:       input.achievements ?? null,
        notes:              input.notes ?? null,
        season:             CURRENT_SEASON,
        curp:               input.curp ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Alta con PDF de CURP (obligatorio) y foto opcional.
   * El PDF queda en bucket privado; la fila guarda solo `curp_document_path` (inmutable vía API).
   */
  static async createWithDocuments(
    input: CreatePlayerMultipartInput,
    files: { curpPdf: Express.Multer.File; photo?: Express.Multer.File },
  ) {
    const pdfBuf = files.curpPdf.buffer as Buffer;
    if (!isPdfBuffer(pdfBuf)) {
      throw new BadRequestError('El archivo de CURP no es un PDF válido');
    }
    if (files.curpPdf.size > env.STORAGE_MAX_CURP_PDF_BYTES) {
      throw new BadRequestError('El PDF de CURP supera el tamaño máximo permitido');
    }

    const base: CreatePlayerInput = { ...input };
    const player = await PlayersService.create(base);

    const curpBucket = env.STORAGE_BUCKET_PLAYER_CURP;
    const avatarBucket = env.STORAGE_BUCKET_PLAYERS;
    const curpPath = `${player.id}/${randomUUID()}.pdf`;
    let avatarObjectPath: string | null = null;

    try {
      const { error: upPdf } = await supabaseAdmin.storage
        .from(curpBucket)
        .upload(curpPath, pdfBuf, { contentType: 'application/pdf', upsert: false });

      if (upPdf) throw new Error(upPdf.message);

      let avatarUrl: string | null = player.avatar_url ?? null;
      if (files.photo) {
        const ext = extFromPhotoMime(files.photo.mimetype);
        avatarObjectPath = `${player.id}/${randomUUID()}.${ext}`;
        const { error: upPh } = await supabaseAdmin.storage
          .from(avatarBucket)
          .upload(avatarObjectPath, files.photo.buffer as Buffer, {
            contentType: files.photo.mimetype,
            upsert: false,
          });
        if (upPh) throw new Error(upPh.message);
        const { data: pub } = supabaseAdmin.storage.from(avatarBucket).getPublicUrl(avatarObjectPath);
        avatarUrl = pub.publicUrl;
      }

      const { data: updated, error: upRow } = await supabaseAdmin
        .from('players')
        .update({ avatar_url: avatarUrl, curp_document_path: curpPath })
        .eq('id', player.id)
        .select()
        .single();

      if (upRow) throw new Error(upRow.message);
      return updated;
    } catch (err) {
      await supabaseAdmin.storage.from(curpBucket).remove([curpPath]).catch(() => {});
      if (avatarObjectPath) {
        await supabaseAdmin.storage.from(avatarBucket).remove([avatarObjectPath]).catch(() => {});
      }
      await supabaseAdmin.from('players').delete().eq('id', player.id);
      throw err;
    }
  }

  /** URL firmada temporal solo para administración (no coaches). */
  static async getSignedCurpDocumentUrl(playerId: string, role: UserRole): Promise<string> {
    if (role !== 'admin') {
      throw new ForbiddenError('Solo administración puede abrir el PDF de CURP');
    }
    const row = await PlayersService.getById(playerId);
    const path = row.curp_document_path as string | null | undefined;
    if (!path) throw new NotFoundError('Este jugador no tiene PDF de CURP registrado');

    const { data, error } = await supabaseAdmin.storage
      .from(env.STORAGE_BUCKET_PLAYER_CURP)
      .createSignedUrl(path, 120);

    if (error || !data?.signedUrl) throw new Error(error?.message ?? 'No se pudo generar enlace al documento');
    return data.signedUrl;
  }

  static async update(id: string, input: UpdatePlayerInput) {
    await PlayersService.getById(id);

    const updateData: Record<string, unknown> = {};
    if (input.firstName !== undefined)         updateData.first_name         = input.firstName;
    if (input.lastName !== undefined)          updateData.last_name          = input.lastName;
    if (input.birthDate !== undefined)         updateData.birth_date         = input.birthDate;
    if (input.nationality !== undefined)       updateData.nationality        = input.nationality;
    if (input.position !== undefined)          updateData.position           = input.position;
    if (input.secondaryPosition !== undefined) updateData.secondary_position = input.secondaryPosition;
    if (input.jerseyNumber !== undefined)      updateData.jersey_number      = input.jerseyNumber;
    if (input.dominantFoot !== undefined)      updateData.dominant_foot      = input.dominantFoot;
    if (input.heightCm !== undefined)          updateData.height_cm          = input.heightCm;
    if (input.weightKg !== undefined)          updateData.weight_kg          = input.weightKg;
    if (input.category !== undefined)          updateData.category           = input.category;
    if (input.sportDescription !== undefined)  updateData.sport_description  = input.sportDescription;
    if (input.avatarUrl !== undefined)         updateData.avatar_url         = input.avatarUrl;
    if (input.achievements !== undefined)      updateData.achievements       = input.achievements;
    if (input.notes !== undefined)             updateData.notes              = input.notes;
    if (input.curp !== undefined)              updateData.curp               = input.curp;

    const { data, error } = await supabaseAdmin
      .from('players')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async verify(id: string, verifiedBy: string) {
    await PlayersService.getById(id);

    const { data, error } = await supabaseAdmin
      .from('players')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: verifiedBy,
        status:      'active',
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async generateQr(id: string) {
    await PlayersService.getById(id);

    const { data, error } = await supabaseAdmin.rpc('generate_player_qr_token', {
      p_player_id: id,
    });

    if (error) throw new Error(error.message);
    return { qrToken: data };
  }

  static async softDelete(id: string) {
    await PlayersService.getById(id);

    const { error } = await supabaseAdmin
      .from('players')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
