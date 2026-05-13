import { supabaseAdmin } from '@config/database';
import { NotFoundError } from '@middlewares/error.middleware';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import type { ListMatchesQuery, CreateMatchBody, UpdateMatchBody, ConvocatoryBody } from './matches.validation';

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
      query = query.or(`title.ilike.%${opts.search}%,opponent_name.ilike.%${opts.search}%`);
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
        created_by:          createdBy,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: string, input: UpdateMatchBody) {
    await MatchesService.getPublicById(id);

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
