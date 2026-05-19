import { supabaseAdmin } from '@config/database';
import { BadRequestError, NotFoundError } from '@middlewares/error.middleware';

const MVP_PLAYER_COLUMNS =
  'id, slug, first_name, last_name, jersey_number, position, category, avatar_url, sport_description';

export interface MvpOfWeekPayload {
  playerId:   string | null;
  weekLabel:  string | null;
  updatedAt:  string | null;
  player:     Record<string, unknown> | null;
}

async function getActiveClubSettingsRow() {
  const { data, error } = await supabaseAdmin
    .from('club_settings')
    .select('id, mvp_player_id, mvp_week_label, mvp_updated_at')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError('Configuración del club no encontrada');
  return data as {
    id: string;
    mvp_player_id: string | null;
    mvp_week_label: string | null;
    mvp_updated_at: string | null;
  };
}

async function fetchMvpPlayer(playerId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabaseAdmin
    .from('players')
    .select(MVP_PLAYER_COLUMNS)
    .eq('id', playerId)
    .eq('status', 'active')
    .eq('is_verified', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Record<string, unknown> | null;
}

function mapPayload(
  settings: { mvp_player_id: string | null; mvp_week_label: string | null; mvp_updated_at: string | null },
  player: Record<string, unknown> | null,
): MvpOfWeekPayload {
  return {
    playerId:  settings.mvp_player_id,
    weekLabel: settings.mvp_week_label,
    updatedAt: settings.mvp_updated_at,
    player: player
      ? {
          id:               player.id,
          slug:             player.slug ?? null,
          firstName:        player.first_name,
          lastName:         player.last_name,
          jerseyNumber:     player.jersey_number ?? null,
          position:         player.position ?? null,
          category:         player.category ?? null,
          avatarUrl:        player.avatar_url ?? null,
          sportDescription: player.sport_description ?? null,
        }
      : null,
  };
}

export class MvpOfWeekService {
  static async getPublic(): Promise<MvpOfWeekPayload> {
    const settings = await getActiveClubSettingsRow();
    if (!settings.mvp_player_id) {
      return mapPayload(settings, null);
    }
    const player = await fetchMvpPlayer(settings.mvp_player_id);
    return mapPayload(settings, player);
  }

  static async getAdmin(): Promise<MvpOfWeekPayload> {
    return MvpOfWeekService.getPublic();
  }

  static async set(playerId: string | null, weekLabel?: string | null): Promise<MvpOfWeekPayload> {
    const settings = await getActiveClubSettingsRow();

    if (playerId) {
      const { data: exists, error: exErr } = await supabaseAdmin
        .from('players')
        .select('id')
        .eq('id', playerId)
        .is('deleted_at', null)
        .maybeSingle();

      if (exErr) throw new Error(exErr.message);
      if (!exists) throw new BadRequestError('Jugador no encontrado');
    }

    const label = weekLabel?.trim() || null;
    const now = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('club_settings')
      .update({
        mvp_player_id:   playerId,
        mvp_week_label:  label,
        mvp_updated_at:  playerId ? now : null,
      })
      .eq('id', settings.id);

    if (error) throw new Error(error.message);
    return MvpOfWeekService.getPublic();
  }
}
