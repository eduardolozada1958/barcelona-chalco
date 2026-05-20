import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import {
  MVP_PHRASES,
  TOP_SCORER_PHRASES,
  TOP_SCORER_PODIUM_PHRASES,
  pickStablePhrase,
} from '@/config/celebration-phrases';
import type { PlayerHighlightKind } from '@/hooks/usePlayerHighlights';
import { MaterialIcon } from '@/components/MaterialIcon';

const FIREWORKS_GIF = '/images/celebration-fireworks.gif';

interface PlayerProfileCelebrationProps {
  playerId: string;
  playerName: string;
  kind: PlayerHighlightKind;
  weekLabel?: string | null;
  goals?: number | null;
  scorerRank?: number | null;
}

function FireworksOverlay({ active }: { active: boolean }) {
  if (!active) return null;

  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    return (
      <motion.div
        className="pointer-events-none fixed inset-0 z-[55] flex items-start justify-center pt-24 sm:pt-28"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden
      >
        <span className="text-4xl" role="img" aria-label="Celebración">
          🎉
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[55] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      aria-hidden
    >
      <div className="absolute inset-0 bg-black/25" />
      <img
        src={FIREWORKS_GIF}
        alt=""
        className="absolute left-[5%] top-[8%] w-28 sm:w-40 h-auto drop-shadow-[0_0_20px_rgba(242,202,80,0.8)]"
        draggable={false}
      />
      <img
        src={FIREWORKS_GIF}
        alt=""
        className="absolute right-[8%] top-[12%] w-32 sm:w-44 h-auto drop-shadow-[0_0_20px_rgba(242,202,80,0.8)] scale-x-[-1]"
        draggable={false}
      />
      <img
        src={FIREWORKS_GIF}
        alt=""
        className="absolute left-1/2 -translate-x-1/2 top-[4%] w-36 sm:w-52 h-auto drop-shadow-[0_0_24px_rgba(255,200,80,0.9)]"
        draggable={false}
      />
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="celebration-spark absolute block h-2 w-2 rounded-full bg-primary"
          style={{
            left: `${8 + (i * 7) % 84}%`,
            top: `${10 + (i * 11) % 40}%`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </motion.div>
  );
}

function titleForKind(kind: PlayerHighlightKind, goals: number | null, rank: number | null): string {
  if (kind === 'mvp') return '¡MVP de la semana!';
  if (kind === 'top_scorer') {
    return goals != null
      ? `¡Goleador líder con ${goals} gol${goals === 1 ? '' : 'es'}!`
      : '¡Goleador líder de la temporada!';
  }
  if (kind === 'top_scorer_podium') {
    return rank != null && goals != null
      ? `¡Top ${rank} goleador — ${goals} gol${goals === 1 ? '' : 'es'}!`
      : '¡Entre los máximos goleadores!';
  }
  return '';
}

export function PlayerProfileCelebration({
  playerId,
  playerName,
  kind,
  weekLabel,
  goals,
  scorerRank,
}: PlayerProfileCelebrationProps) {
  const [showFx, setShowFx] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const phrase = useMemo(() => {
    if (!kind) return '';
    const seed = `${playerId}-${kind}`;
    if (kind === 'mvp') return pickStablePhrase(MVP_PHRASES, seed);
    if (kind === 'top_scorer') return pickStablePhrase(TOP_SCORER_PHRASES, seed);
    return pickStablePhrase(TOP_SCORER_PODIUM_PHRASES, seed);
  }, [kind, playerId]);

  const heavyFx = kind === 'mvp' || kind === 'top_scorer';

  useEffect(() => {
    if (!kind || !heavyFx) {
      setShowFx(false);
      return;
    }
    setShowFx(true);
    const t = window.setTimeout(() => setShowFx(false), 6000);
    return () => window.clearTimeout(t);
  }, [kind, heavyFx, playerId]);

  if (!kind || dismissed) return null;

  const title = titleForKind(kind, goals ?? null, scorerRank ?? null);

  return (
    <>
      <AnimatePresence>{showFx ? <FireworksOverlay active /> : null}</AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-40 mb-stack-md overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-r from-primary/20 via-surface-container-high to-secondary/15 p-4 sm:p-5 shadow-[0_0_40px_rgba(242,202,80,0.15)]"
      >
        {showFx ? (
          <motion.div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(242,202,80,0.25),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(179,197,255,0.2),transparent_45%)]"
            animate={{ opacity: [0.6, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            aria-hidden
          />
        ) : null}

        <div className="relative flex gap-3 sm:gap-4 items-start">
          <div className="shrink-0 w-11 h-11 rounded-full bg-primary/25 border border-primary/50 flex items-center justify-center">
            <MaterialIcon
              name={kind === 'mvp' ? 'emoji_events' : 'sports_soccer'}
              className="text-primary"
              size={26}
              filled
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-label-caps text-[10px] text-primary tracking-widest mb-1">
              {kind === 'mvp' ? 'FELICIDADES' : 'DESTACADO DEL CLUB'}
            </p>
            <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface leading-tight">{title}</h2>
            {weekLabel && kind === 'mvp' ? (
              <p className="text-xs text-on-surface-variant mt-1">{weekLabel}</p>
            ) : null}
            <p className="mt-2 text-sm sm:text-body-md text-on-surface-variant leading-relaxed italic">
              «{phrase}»
            </p>
            <p className="mt-2 text-xs text-primary/90 font-label-caps">{playerName}</p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 touch-manipulation"
            aria-label="Cerrar mensaje"
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>
      </motion.div>
    </>
  );
}

export function PlayerHighlightBadge({ kind }: { kind: PlayerHighlightKind }) {
  if (!kind) return null;
  const label =
    kind === 'mvp' ? 'MVP semana' : kind === 'top_scorer' ? 'Goleador #1' : 'Top goleo';
  const icon = kind === 'mvp' ? 'emoji_events' : 'sports_soccer';

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/40 text-primary font-label-caps text-[10px] tracking-wide">
      <MaterialIcon name={icon} size={14} filled />
      {label}
    </span>
  );
}
