import { getFormationSlots } from '@/config/formations';
import type { PitchPlayer } from '@/utils/lineup-players';
import { displayPlayerShort } from '@/utils/lineup-players';

export interface MatchFormationPitchProps {
  formation: 'football_7' | 'football_11';
  slots: (PitchPlayer | null)[];
  interactive?: boolean;
  selectedSlot?: number | null;
  onSlotClick?: (slotIndex: number) => void;
  className?: string;
}

export function MatchFormationPitch({
  formation,
  slots,
  interactive = false,
  selectedSlot = null,
  onSlotClick,
  className = '',
}: MatchFormationPitchProps) {
  const formationSlots = getFormationSlots(formation);

  return (
    <div className={className}>
      <div className="relative w-full max-w-md mx-auto aspect-[2/3] rounded-xl overflow-hidden border-2 border-white/25 shadow-inner">
        <PitchFieldSvg />
        {formationSlots.map((pos, i) => {
          const player = slots[i] ?? null;
          const selected = selectedSlot === i;
          const filled = Boolean(player);
          return (
            <button
              key={`${pos.role}-${i}`}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onSlotClick?.(i)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 max-w-[28%] z-10 transition-transform ${
                interactive ? 'cursor-pointer hover:scale-105' : 'cursor-default'
              } ${selected ? 'scale-110 z-20' : ''}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              title={interactive ? (filled ? displayPlayerShort(player!) : `Casilla ${pos.role}`) : undefined}
            >
              <span
                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 text-[11px] sm:text-xs font-bold shadow-md ${
                  filled
                    ? i === 0
                      ? 'bg-red-600 border-red-300 text-white'
                      : 'bg-white border-primary text-primary'
                    : 'bg-black/35 border-white/50 text-white/80'
                } ${selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-transparent' : ''}`}
              >
                {filled ? (player!.jerseyNumber ?? i + 1) : '+'}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium text-center leading-tight truncate max-w-full ${
                  filled ? 'bg-black/75 text-white' : 'bg-black/50 text-white/70'
                }`}
              >
                {filled ? displayPlayerShort(player!) : pos.role}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PitchFieldSvg() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-700 via-emerald-600 to-emerald-700">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 12%, rgba(0,0,0,0.08) 12%, rgba(0,0,0,0.08) 24%)',
          }}
        />
      </div>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none text-white/85"
        viewBox="0 0 100 150"
        preserveAspectRatio="none"
        aria-hidden
      >
        <rect x="2" y="2" width="96" height="146" fill="none" stroke="currentColor" strokeWidth="0.6" />
        <line x1="2" y1="75" x2="98" y2="75" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="50" cy="75" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <rect x="22" y="2" width="56" height="22" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <rect x="32" y="2" width="36" height="8" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <rect x="22" y="126" width="56" height="22" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <rect x="32" y="140" width="36" height="8" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <path d="M 22 126 A 10 10 0 0 0 32 126" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <path d="M 68 126 A 10 10 0 0 1 78 126" fill="none" stroke="currentColor" strokeWidth="0.4" />
      </svg>
    </>
  );
}
