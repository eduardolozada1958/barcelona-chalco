import { supabaseAdmin } from '@config/database';
import { NotFoundError, ConflictError } from '@middlewares/error.middleware';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import type { ListResultsQuery, CreateResultBody, UpdateResultBody, PlayerStatInput } from './results.validation';

export class ResultsService {
  static async listPublic(opts: ListResultsQuery) {
    let query = supabaseAdmin
      .from('v_match_results')
      .select('*', { count: 'exact' })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1
      );

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: data ?? [], meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit) };
  }

  static async latestPublic() {
    const { data, error } = await supabaseAdmin
      .from('v_match_results')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  static async listAdmin(opts: ListResultsQuery) {
    let query = supabaseAdmin
      .from('results')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1
      );

    if (opts.published === true)  query = query.eq('published', true);
    if (opts.published === false) query = query.eq('published', false);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: data ?? [], meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit) };
  }

  static async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('results')
      .select('*, player_stats(*)')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundError('Resultado no encontrado');
    return data;
  }

  static async create(input: CreateResultBody, createdBy: string) {
    const { data: existing } = await supabaseAdmin
      .from('results')
      .select('id')
      .eq('match_id', input.matchId)
      .maybeSingle();

    if (existing) throw new ConflictError('Este partido ya tiene un resultado registrado');

    const { data, error } = await supabaseAdmin
      .from('results')
      .insert({
        match_id:            input.matchId,
        goals_scored:        input.goalsScored,
        goals_conceded:      input.goalsConceded,
        match_report:        input.matchReport ?? null,
        highlight_url:       input.highlightUrl ?? null,
        featured_player_id:  input.featuredPlayerId ?? null,
        created_by:          createdBy,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: string, input: UpdateResultBody) {
    await ResultsService.getById(id);

    const u: Record<string, unknown> = {};
    if (input.goalsScored !== undefined)       u.goals_scored        = input.goalsScored;
    if (input.goalsConceded !== undefined)     u.goals_conceded      = input.goalsConceded;
    if (input.matchReport !== undefined)       u.match_report        = input.matchReport;
    if (input.highlightUrl !== undefined)      u.highlight_url       = input.highlightUrl;
    if (input.featuredPlayerId !== undefined)  u.featured_player_id = input.featuredPlayerId;

    if (Object.keys(u).length > 0) {
      const { error: upErr } = await supabaseAdmin.from('results').update(u).eq('id', id);
      if (upErr) throw new Error(upErr.message);
    }

    if (input.playerStats && input.playerStats.length > 0) {
      await ResultsService.replacePlayerStats(id, input.playerStats);
    }

    return ResultsService.getById(id);
  }

  static async replacePlayerStats(resultId: string, stats: PlayerStatInput[]) {
    const { error: delErr } = await supabaseAdmin.from('player_stats').delete().eq('result_id', resultId);
    if (delErr) throw new Error(delErr.message);

    const rows = stats.map((s) => ({
      result_id:       resultId,
      player_id:       s.playerId,
      goals:           s.goals,
      assists:         s.assists,
      yellow_cards:    s.yellowCards,
      red_cards:       s.redCards,
      minutes_played:  s.minutesPlayed,
      rating:          s.rating ?? null,
      notes:           s.notes ?? null,
    }));

    const { error: insErr } = await supabaseAdmin.from('player_stats').insert(rows);
    if (insErr) throw new Error(insErr.message);
  }

  static async publish(id: string) {
    await ResultsService.getById(id);

    const { data, error } = await supabaseAdmin
      .from('results')
      .update({
        published:    true,
        published_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
