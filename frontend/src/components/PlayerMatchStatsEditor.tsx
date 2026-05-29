import { formInputClass } from '@/components/DashboardModal';
import { PlayerAvatar } from '@/components/PlayerAvatar';

export type PlayerStatDraft = {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
};

const statInputClass = `${formInputClass} w-full min-w-0 text-center px-2 py-2.5 text-base tabular-nums touch-manipulation`;

function parseStatDigits(raw: string, max: number): number {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 0;
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(max, n);
}

function StatInput({
  value,
  max,
  label,
  onChange,
}: {
  value: number;
  max: number;
  label: string;
  onChange: (n: number) => void;
}) {
  const display = value === 0 ? '' : String(value);

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      enterKeyHint="done"
      aria-label={label}
      className={statInputClass}
      value={display}
      onChange={(e) => onChange(parseStatDigits(e.target.value, max))}
    />
  );
}

export function PlayerMatchStatsEditor({
  players,
  statsByPlayer,
  avatarByPlayerId,
  onPatch,
}: {
  players: Record<string, unknown>[];
  statsByPlayer: Record<string, PlayerStatDraft>;
  avatarByPlayerId: Map<string, string>;
  onPatch: (playerId: string, patch: Partial<PlayerStatDraft>) => void;
}) {
  if (players.length === 0) {
    return <p className="p-4 text-on-surface-variant text-sm">No hay jugadores en el sistema.</p>;
  }

  return (
    <>
      {/* Móvil: tarjeta por jugador — columnas alineadas sin scroll horizontal confuso */}
      <div className="md:hidden space-y-2 max-h-[min(52dvh,420px)] overflow-y-auto overscroll-contain pr-0.5">
        {players.map((p) => {
          const pid = String(p.id);
          const jersey = p.jersey_number != null ? ` · #${p.jersey_number}` : '';
          const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || pid;
          const d = statsByPlayer[pid] ?? { goals: 0, assists: 0, yellowCards: 0, redCards: 0 };

          return (
            <div
              key={pid}
              className="rounded-lg border border-outline-variant/25 bg-surface-container/30 p-3"
            >
              <div className="flex items-center gap-2 min-w-0 mb-3">
                <PlayerAvatar
                  name={name}
                  avatarUrl={avatarByPlayerId.get(pid) ?? null}
                  size="sm"
                />
                <p className="text-sm font-medium text-on-surface leading-snug break-words min-w-0 flex-1">
                  {name}
                  {jersey ? <span className="text-on-surface-variant font-normal">{jersey}</span> : null}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="block text-[10px] font-label-caps text-on-surface-variant text-center mb-1">
                    Gol
                  </span>
                  <StatInput
                    label={`Goles de ${name}`}
                    value={d.goals}
                    max={20}
                    onChange={(goals) => onPatch(pid, { goals })}
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-label-caps text-on-surface-variant text-center mb-1">
                    Ast
                  </span>
                  <StatInput
                    label={`Asistencias de ${name}`}
                    value={d.assists}
                    max={20}
                    onChange={(assists) => onPatch(pid, { assists })}
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-label-caps text-on-surface-variant text-center mb-1">
                    🟨
                  </span>
                  <StatInput
                    label={`Amarillas de ${name}`}
                    value={d.yellowCards}
                    max={2}
                    onChange={(yellowCards) => onPatch(pid, { yellowCards })}
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-label-caps text-on-surface-variant text-center mb-1">
                    🟥
                  </span>
                  <StatInput
                    label={`Rojas de ${name}`}
                    value={d.redCards}
                    max={1}
                    onChange={(redCards) => onPatch(pid, { redCards })}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Escritorio: tabla con anchos fijos para alinear encabezados y celdas */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-outline-variant/20 max-h-[320px] overflow-y-auto">
        <table className="w-full min-w-[520px] table-fixed text-sm">
          <colgroup>
            <col />
            <col className="w-[4.25rem]" />
            <col className="w-[4.25rem]" />
            <col className="w-[4.25rem]" />
            <col className="w-[4.25rem]" />
          </colgroup>
          <thead className="sticky top-0 bg-surface-container-high z-[1]">
            <tr className="text-on-surface-variant text-[10px] font-label-caps uppercase tracking-wide">
              <th className="px-3 py-2 text-left">Jugador</th>
              <th className="px-2 py-2 text-center">Gol</th>
              <th className="px-2 py-2 text-center">Ast</th>
              <th className="px-2 py-2 text-center">🟨</th>
              <th className="px-2 py-2 text-center">🟥</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const pid = String(p.id);
              const jersey = p.jersey_number != null ? ` · #${p.jersey_number}` : '';
              const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || pid;
              const d = statsByPlayer[pid] ?? { goals: 0, assists: 0, yellowCards: 0, redCards: 0 };

              return (
                <tr key={pid} className="border-t border-outline-variant/10">
                  <td className="px-3 py-2 text-on-surface align-middle">
                    <span className="flex items-center gap-2 min-w-0" title={name}>
                      <PlayerAvatar
                        name={name}
                        avatarUrl={avatarByPlayerId.get(pid) ?? null}
                        size="sm"
                      />
                      <span className="truncate">{name}{jersey}</span>
                    </span>
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <StatInput
                      label={`Goles de ${name}`}
                      value={d.goals}
                      max={20}
                      onChange={(goals) => onPatch(pid, { goals })}
                    />
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <StatInput
                      label={`Asistencias de ${name}`}
                      value={d.assists}
                      max={20}
                      onChange={(assists) => onPatch(pid, { assists })}
                    />
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <StatInput
                      label={`Amarillas de ${name}`}
                      value={d.yellowCards}
                      max={2}
                      onChange={(yellowCards) => onPatch(pid, { yellowCards })}
                    />
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <StatInput
                      label={`Rojas de ${name}`}
                      value={d.redCards}
                      max={1}
                      onChange={(redCards) => onPatch(pid, { redCards })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
