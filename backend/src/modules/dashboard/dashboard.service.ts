import { supabaseAdmin } from '@config/database';

export interface CoachDashboardStats {
  totalPlayers:         number;
  verifiedPlayers:      number;
  newPlayersThisMonth:  number;
  pendingInscriptions:  number;
}

export class DashboardService {
  static async getCoachStats(): Promise<CoachDashboardStats> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalRes,
      verifiedRes,
      newMonthRes,
      pendingInsRes,
    ] = await Promise.all([
      supabaseAdmin
        .from('players')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null),
      supabaseAdmin
        .from('players')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('is_verified', true),
      supabaseAdmin
        .from('players')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('created_at', monthStart.toISOString()),
      supabaseAdmin
        .from('inscriptions')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .in('status', ['pending', 'under_review']),
    ]);

    const firstErr =
      totalRes.error ??
      verifiedRes.error ??
      newMonthRes.error ??
      pendingInsRes.error;
    if (firstErr) throw new Error(firstErr.message);

    return {
      totalPlayers:        totalRes.count ?? 0,
      verifiedPlayers:   verifiedRes.count ?? 0,
      newPlayersThisMonth: newMonthRes.count ?? 0,
      pendingInscriptions: pendingInsRes.count ?? 0,
    };
  }
}
