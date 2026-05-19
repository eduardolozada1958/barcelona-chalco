import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { getMvpOfWeekAdmin, listPlayersAdmin, setMvpOfWeek } from '@/api/players';
import { MaterialIcon } from '@/components/MaterialIcon';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { playerPublicPath } from '@/utils/player-path';

export function MvpOfWeekPanel() {
  const qc = useQueryClient();
  const mvpQ = useQuery({ queryKey: ['mvp-of-week-admin'], queryFn: getMvpOfWeekAdmin });
  const playersQ = useQuery({
    queryKey: ['players-admin', 'mvp-picker'],
    queryFn:  () => listPlayersAdmin({ page: 1, limit: 200, status: 'active' }),
  });

  const [playerId, setPlayerId] = useState('');
  const [weekLabel, setWeekLabel] = useState('');

  const mvp = mvpQ.data?.data;

  useEffect(() => {
    if (!mvp) return;
    setPlayerId(mvp.playerId ?? '');
    setWeekLabel(mvp.weekLabel ?? '');
  }, [mvp?.playerId, mvp?.weekLabel, mvp]);

  const save = useMutation({
    mutationFn: () =>
      setMvpOfWeek({
        playerId: playerId || null,
        weekLabel: weekLabel.trim() || null,
      }),
    onSuccess: (res) => {
      toast.success(res.message ?? 'MVP guardado');
      void qc.invalidateQueries({ queryKey: ['mvp-of-week-admin'] });
      void qc.invalidateQueries({ queryKey: ['mvp-of-week-public'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clear = useMutation({
    mutationFn: () => setMvpOfWeek({ playerId: null, weekLabel: null }),
    onSuccess: (res) => {
      toast.success(res.message ?? 'MVP quitado');
      setPlayerId('');
      setWeekLabel('');
      void qc.invalidateQueries({ queryKey: ['mvp-of-week-admin'] });
      void qc.invalidateQueries({ queryKey: ['mvp-of-week-public'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const players = (playersQ.data?.data ?? []) as Record<string, unknown>[];
  const currentPlayer = mvp?.player;

  return (
    <section className="mb-stack-md rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface-container/40 to-surface-container/20 p-stack-md">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface flex items-center gap-2">
            <MaterialIcon name="emoji_events" className="text-primary" filled />
            MVP de la semana
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Se muestra en la página de inicio (público). Elige un jugador de la plantilla y guarda.
          </p>
        </div>
        {currentPlayer ? (
          <Link
            to={playerPublicPath({ id: currentPlayer.id, slug: currentPlayer.slug })}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline font-label-caps shrink-0"
          >
            Ver en sitio público →
          </Link>
        ) : null}
      </header>

      {currentPlayer ? (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-surface-container/50 border border-outline-variant/20">
          <PlayerAvatar
            name={`${currentPlayer.firstName} ${currentPlayer.lastName}`}
            avatarUrl={currentPlayer.avatarUrl ?? null}
            size="md"
          />
          <div>
            <p className="font-medium text-on-surface">
              Actual: {currentPlayer.firstName} {currentPlayer.lastName}
              {currentPlayer.jerseyNumber != null ? ` · #${currentPlayer.jerseyNumber}` : ''}
            </p>
            {mvp?.weekLabel ? (
              <p className="text-xs text-on-surface-variant mt-0.5">{mvp.weekLabel}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant mb-4 rounded-lg border border-dashed border-outline-variant/30 px-3 py-2">
          Aún no hay MVP asignado. El inicio mostrará un espacio vacío hasta que elijas uno.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Jugador</label>
          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface text-sm"
          >
            <option value="">— Sin MVP —</option>
            {players.map((p) => (
              <option key={String(p.id)} value={String(p.id)}>
                {String(p.first_name)} {String(p.last_name)}
                {p.jersey_number != null ? ` (#${String(p.jersey_number)})` : ''}
                {!p.is_verified ? ' · no verificado' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-label-caps text-on-surface-variant mb-1">
            Etiqueta (opcional)
          </label>
          <input
            type="text"
            value={weekLabel}
            onChange={(e) => setWeekLabel(e.target.value)}
            placeholder="Ej. Semana del 12 al 18 de mayo"
            maxLength={120}
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          type="button"
          disabled={save.isPending || clear.isPending}
          onClick={() => save.mutate()}
          className="inline-flex items-center gap-2 bg-primary text-on-primary font-label-caps text-label-caps px-4 py-2 rounded-lg disabled:opacity-60"
        >
          <MaterialIcon name="save" size={16} />
          {save.isPending ? 'Guardando…' : 'Guardar MVP'}
        </button>
        {(playerId || mvp?.playerId) ? (
          <button
            type="button"
            disabled={save.isPending || clear.isPending}
            onClick={() => clear.mutate()}
            className="inline-flex items-center gap-2 border border-outline-variant/30 text-on-surface-variant font-label-caps text-label-caps px-4 py-2 rounded-lg hover:border-error/40 hover:text-error"
          >
            Quitar MVP
          </button>
        ) : null}
      </div>
    </section>
  );
}
