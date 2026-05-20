import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import {
  MVP_PHRASES,
  TOP_SCORER_PHRASES,
  TOP_SCORER_PODIUM_PHRASES,
  pickStablePhrase,
} from '@/config/celebration-phrases';
import type { PlayerHighlightKind } from '@/hooks/usePlayerHighlights';
import { MaterialIcon } from '@/components/MaterialIcon';

interface PlayerProfileCelebrationProps {
  playerId: string;
  playerName: string;
  kind: PlayerHighlightKind;
  weekLabel?: string | null;
  goals?: number | null;
  scorerRank?: number | null;
}

function celebrationSessionKey(playerId: string, kind: string) {
  return `bc-celebration-${playerId}-${kind}`;
}

function FireworksBurst({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = true;

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth ?? window.innerWidth;
      const h = parent?.clientHeight ?? 320;
      canvas.width = w;
      canvas.height = h;
    };
    resize();

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      size: number;
    };

    const particles: Particle[] = [];
    const colors = ['#f2ca50', '#ffe088', '#d4af37', '#b3c5ff', '#ffffff', '#ff9f43'];

    const burst = (cx: number, cy: number) => {
      const n = 36 + Math.floor(Math.random() * 20);
      for (let i = 0; i < n; i += 1) {
        const angle = (Math.PI * 2 * i) / n + Math.random() * 0.4;
        const speed = 2 + Math.random() * 4;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 50 + Math.random() * 30,
          color: colors[Math.floor(Math.random() * colors.length)]!,
          size: 1.5 + Math.random() * 2,
        });
      }
    };

    let frame = 0;
    const maxFrames = 220;
    burst(canvas.width * 0.3, canvas.height * 0.35);
    burst(canvas.width * 0.7, canvas.height * 0.25);

    const tick = () => {
      if (!running) return;
      frame += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (frame % 28 === 0 && frame < 140) {
        burst(
          canvas.width * (0.2 + Math.random() * 0.6),
          canvas.height * (0.15 + Math.random() * 0.35),
        );
      }

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i]!;
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.98;
        const t = 1 - p.life / p.maxLife;
        if (t <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = t;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (frame < maxFrames) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? document.body);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [active]);

  if (!active) return null;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[44] opacity-90"
      aria-hidden
    />
  );
}

function titleForKind(kind: PlayerHighlightKind, goals: number | null, rank: number | null): string {
  if (kind === 'mvp') return '¡MVP de la semana!';
  if (kind === 'top_scorer') return goals != null ? `¡Goleador líder con ${goals} gol${goals === 1 ? '' : 'es'}!` : '¡Goleador líder de la temporada!';
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

  useEffect(() => {
    if (!kind) return;
    const key = celebrationSessionKey(playerId, kind);
    const seen = sessionStorage.getItem(key);
    if (!seen) {
      sessionStorage.setItem(key, '1');
      setShowFx(true);
      const t = window.setTimeout(() => setShowFx(false), 5200);
      return () => window.clearTimeout(t);
    }
    setShowFx(false);
  }, [kind, playerId]);

  if (!kind || dismissed) return null;

  const title = titleForKind(kind, goals ?? null, scorerRank ?? null);
  const heavyFx = kind === 'mvp' || kind === 'top_scorer';

  return (
    <>
      {heavyFx && showFx ? <FireworksBurst active /> : null}

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative z-40 mb-stack-md overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-r from-primary/20 via-surface-container-high to-secondary/15 p-4 sm:p-5 shadow-[0_0_40px_rgba(242,202,80,0.15)]"
          role="status"
          aria-live="polite"
        >
          {heavyFx && showFx ? (
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
              <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface leading-tight">
                {title}
              </h2>
              {weekLabel && kind === 'mvp' ? (
                <p className="text-xs text-on-surface-variant mt-1">{weekLabel}</p>
              ) : null}
              <p className="mt-2 text-sm sm:text-body-md text-on-surface-variant leading-relaxed italic">
                «{phrase}»
              </p>
              <p className="mt-2 text-xs text-primary/90 font-label-caps">
                {playerName}
              </p>
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
      </AnimatePresence>
    </>
  );
}

/** Badge compacto junto al nombre si sigue siendo MVP o goleador líder. */
export function PlayerHighlightBadge({ kind }: { kind: PlayerHighlightKind }) {
  if (!kind) return null;
  const label =
    kind === 'mvp'
      ? 'MVP semana'
      : kind === 'top_scorer'
        ? 'Goleador #1'
        : 'Top goleo';
  const icon = kind === 'mvp' ? 'emoji_events' : 'sports_soccer';

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/40 text-primary font-label-caps text-[10px] tracking-wide">
      <MaterialIcon name={icon} size={14} filled />
      {label}
    </span>
  );
}
