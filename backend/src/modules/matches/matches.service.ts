import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '@config/database';
import { env } from '@config/env';
import { NotFoundError, BadRequestError } from '@middlewares/error.middleware';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import { buildIlikeOrFilter } from '@shared/utils/sanitize-search';
import type { ListMatchesQuery, CreateMatchBody, UpdateMatchBody, ConvocatoryBody } from './matches.validation';

function normalizeLineup(raw: unknown): string[] {
  if (!raw) return [];
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

function validateLineupConsistency(
  formationType: string | null | undefined,
  startingLineup: string[] | null | undefined,
): void {
  const ft = formationType ?? null;
  const ids = startingLineup ?? [];
  if (!ft && ids.length === 0) return;
  if (!ft && ids.length > 0) {
    throw new BadRequestError('Indica formato Fútbol 7 u 11 si registras titulares');
  }
  if (ft && ids.length === 0) {
    throw new BadRequestError('Indica los titulares en orden para el formato elegido');
  }
  if (ids.length > 0 && new Set(ids).size !== ids.length) {
    throw new BadRequestError('Titulares duplicados');
  }
  if (ft === 'football_7' && ids.length !== 7) {
    throw new BadRequestError('Fútbol 7 requiere exactamente 7 titulares');
  }
  if (ft === 'football_11' && ids.length !== 11) {
    throw new BadRequestError('Fútbol 11 requiere exactamente 11 titulares');
  }
}

function extFromLogoMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  throw new BadRequestError('El logo debe ser PNG, JPEG o WebP');
}

async function assertLineupPlayersRegistered(playerIds: string[]): Promise<void> {
  if (playerIds.length === 0) return;
  const { data, error } = await supabaseAdmin
    .from('players')
    .select('id')
    .in('id', playerIds)
    .is('deleted_at', null);

  if (error) throw new Error(error.message);
  if ((data?.length ?? 0) !== playerIds.length) {
    throw new BadRequestError('Un titular no existe o fue dado de baja');
  }
}

export class MatchesService {
  static async listPublic(opts: ListMatchesQuery) {
    let query = supabaseAdmin
      .from('matches')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('match_date', { ascending: true })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1
      );

    if (opts.category) query = query.eq('category', opts.category);
    if (opts.season)    query = query.eq('season', opts.season);
    if (opts.status)    query = query.eq('status', opts.status);
    if (opts.search) {
      const filter = buildIlikeOrFilter(['title', 'opponent_name'], opts.search);
      if (filter) query = query.or(filter);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data, meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit) };
  }

  static async listUpcoming(opts: Pick<ListMatchesQuery, 'page' | 'limit' | 'category' | 'season'>) {
    const nowIso = new Date().toISOString();
    let query = supabaseAdmin
      .from('matches')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .eq('status', 'scheduled')
      .gt('match_date', nowIso)
      .order('match_date', { ascending: true })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1
      );

    if (opts.category) query = query.eq('category', opts.category);
    if (opts.season)    query = query.eq('season', opts.season);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: data ?? [], meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit) };
  }

  static async getPublicById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundError('Partido no encontrado');
    return data;
  }

  static async listAdmin(opts: ListMatchesQuery) {
    return MatchesService.listPublic(opts);
  }

  static async create(input: CreateMatchBody, createdBy: string) {
    validateLineupConsistency(input.formationType ?? null, input.startingLineup ?? null);
    await assertLineupPlayersRegistered(input.startingLineup ?? []);

    const { data, error } = await supabaseAdmin
      .from('matches')
      .insert({
        title:               input.title,
        description:         input.description ?? null,
        opponent_name:       input.opponentName,
        opponent_logo_url:   input.opponentLogoUrl ?? null,
        match_date:          input.matchDate,
        location:            input.location,
        location_maps_url:   input.locationMapsUrl ?? null,
        match_type:          input.matchType,
        category:            input.category,
        status:              input.status,
        is_home:             input.isHome,
        banner_url:          input.bannerUrl ?? null,
        season:              input.season,
        formation_type:      input.formationType ?? null,
        starting_lineup:     input.startingLineup?.length ? input.startingLineup : null,
        created_by:          createdBy,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: string, input: UpdateMatchBody) {
    const existing = await MatchesService.getPublicById(id);

    const u: Record<string, unknown> = {};
    if (input.title !== undefined)             u.title               = input.title;
    if (input.description !== undefined)       u.description         = input.description;
    if (input.opponentName !== undefined)      u.opponent_name       = input.opponentName;
    if (input.opponentLogoUrl !== undefined)   u.opponent_logo_url   = input.opponentLogoUrl;
    if (input.matchDate !== undefined)         u.match_date          = input.matchDate;
    if (input.location !== undefined)          u.location            = input.location;
    if (input.locationMapsUrl !== undefined) u.location_maps_url   = input.locationMapsUrl;
    if (input.matchType !== undefined)         u.match_type          = input.matchType;
    if (input.category !== undefined)          u.category            = input.category;
    if (input.status !== undefined)            u.status              = input.status;
    if (input.isHome !== undefined)            u.is_home             = input.isHome;
    if (input.bannerUrl !== undefined)         u.banner_url          = input.bannerUrl;
    if (input.season !== undefined)            u.season              = input.season;

    const nextFormation =
      input.formationType !== undefined ? input.formationType : (existing.formation_type as string | null | undefined);
    const nextLineupRaw =
      input.startingLineup !== undefined
        ? (input.startingLineup ?? [])
        : normalizeLineup(existing.starting_lineup);

    if (input.formationType !== undefined) u.formation_type = input.formationType;
    if (input.startingLineup !== undefined) u.starting_lineup = input.startingLineup;

    if (
      input.category !== undefined ||
      input.formationType !== undefined ||
      input.startingLineup !== undefined
    ) {
      validateLineupConsistency(nextFormation ?? null, nextLineupRaw);
      await assertLineupPlayersRegistered(nextLineupRaw);
    }

    if (Object.keys(u).length === 0) return MatchesService.getPublicById(id);

    const { data, error } = await supabaseAdmin
      .from('matches')
      .update(u)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async softDelete(id: string) {
    await MatchesService.getPublicById(id);
    const { error } = await supabaseAdmin
      .from('matches')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  /** Sube escudo del rival y actualiza `opponent_logo_url`. */
  static async updateOpponentLogoFromUpload(id: string, file: Express.Multer.File) {
    await MatchesService.getPublicById(id);
    if (file.size > env.STORAGE_MAX_FILE_SIZE) {
      throw new BadRequestError('El logo supera el tamaño máximo permitido');
    }
    const ext = extFromLogoMime(file.mimetype);
    const objectPath = `${id}/${randomUUID()}.${ext}`;
    const bucket = env.STORAGE_BUCKET_MATCH_LOGOS;

    const { error: upErr } = await supabaseAdmin.storage
      .from(bucket)
      .upload(objectPath, file.buffer as Buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
    if (upErr) throw new Error(upErr.message);

    const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(objectPath);
    const logoUrl = pub.publicUrl;

    const { data, error } = await supabaseAdmin
      .from('matches')
      .update({ opponent_logo_url: logoUrl })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async addConvocatories(matchId: string, body: ConvocatoryBody) {
    await MatchesService.getPublicById(matchId);

    const rows = body.playerIds.map((playerId) => ({
      match_id:  matchId,
      player_id: playerId,
      status:    'called' as const,
    }));

    const { data, error } = await supabaseAdmin
      .from('match_convocatories')
      .upsert(rows, { onConflict: 'match_id,player_id', ignoreDuplicates: true })
      .select();

    if (error) throw new Error(error.message);
    return data ?? [];
  }
}
