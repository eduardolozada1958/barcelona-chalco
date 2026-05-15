import { useMemo, useState } from 'react';

import { formationSlotCount } from '@/config/formations';
import { MatchFormationPitch } from '@/components/MatchFormationPitch';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { PitchPlayer } from '@/utils/lineup-players';
import { displayPlayerName, slotsToPitchPlayers } from '@/utils/lineup-players';

export interface LineupPitchEditorProps {
  formation: 'football_7' | 'football_11';
  slots: (string | null)[];
  onChange: (slots: (string | null)[]) => void;
  roster: PitchPlayer[];
}

export function LineupPitchEditor({ formation, slots, onChange, roster }: LineupPitchEditorProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const need = formationSlotCount(formation);
  const pitchSlots = useMemo(() => slotsToPitchPlayers(slots, roster), [slots, roster]);

  const filledCount = slots.filter(Boolean).length;

  const assignPlayer = (playerId: string) => {
    const target = selectedSlot ?? slots.findIndex((s) => !s);
    if (target < 0 || target >= need) return;

    const next = [...slots];
    while (next.length < need) next.push(null);
    for (let i = 0; i < need; i++) {
      if (next[i] === playerId) next[i] = null;
    }
    next[target] = playerId;
    onChange(next.slice(0, need));
    setSelectedSlot(target + 1 < need ? target + 1 : target);
  };

  const clearSlot = (index: number) => {
    const next = [...slots];
    while (next.length < need) next.push(null);
    next[index] = null;
    onChange(next.slice(0, need));
    setSelectedSlot(index);
  };

  const handleSlotClick = (index: number) => {
    if (slots[index]) {
      clearSlot(index);
    } else {
      setSelectedSlot(index);
    }
  };

  const clearAll = () => {
    onChange(Array(need).fill(null));
    setSelectedSlot(0);
  };

  const usedIds = new Set(slots.filter((x): x is string => Boolean(x)));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-on-surface-variant">
          Toca una casilla en la cancha y luego un jugador de la lista. Toca de nuevo la casilla ocupada para quitarlo.
        </p>
        <span className="text-xs font-label-caps text-primary">
          {filledCount} / {need}
        </span>
      </div>

      <MatchFormationPitch
        formation={formation}
        slots={pitchSlots}
        interactive
        selectedSlot={selectedSlot}
        onSlotClick={handleSlotClick}
      />

      {selectedSlot !== null && !slots[selectedSlot] ? (
        <p className="text-xs text-primary text-center">
          Elige jugador para la casilla {selectedSlot + 1}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={clearAll}
          className="text-[10px] font-label-caps text-on-surface-variant hover:text-primary"
        >
          Vaciar cancha
        </button>
      </div>

      <div className="max-h-44 overflow-y-auto rounded-lg border border-outline-variant/20 divide-y divide-outline-variant/10">
        {roster.map((p) => {
          const inLineup = usedIds.has(p.id);
          const disabled = inLineup && slots[selectedSlot ?? -1] !== p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => assignPlayer(p.id)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 ${
                disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-container-high/50'
              } ${inLineup ? 'bg-primary/5 text-primary' : 'text-on-surface'}`}
            >
              <span>
                {p.jerseyNumber != null ? `#${p.jerseyNumber} · ` : ''}
                {displayPlayerName(p)}
              </span>
              {inLineup ? (
                <MaterialIcon name="check_circle" size={16} filled />
              ) : (
                <MaterialIcon name="add_circle_outline" size={16} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
