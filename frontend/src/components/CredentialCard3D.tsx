import { useRef, useState } from 'react';

import { MaterialIcon } from '@/components/MaterialIcon';
import { CLUB_LOGO_URL } from '@/config/club';

/** Datos mínimos devueltos por `/qr/validate/:token` (snake_case). */
export type CredentialViewerPlayer = Record<string, unknown>;

const MAX_TILT_DEG = 18;

function formatBirthEs(iso: unknown): string {
  if (!iso || typeof iso !== 'string') return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

function calcAge(birthDate: unknown): number | null {
  if (!birthDate || typeof birthDate !== 'string') return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function footLabel(raw: unknown): string {
  if (raw === 'right') return 'Diestro';
  if (raw === 'left') return 'Zurdo';
  if (raw === 'both') return 'Ambidiestro';
  return '—';
}

function str(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

type CredentialCard3DProps = {
  player: CredentialViewerPlayer;
  /** Modo pantalla completa (más sombra y contraste). */
  immersive?: boolean;
  className?: string;
};

/**
 * Tarjeta deportiva premium con perspectiva 3D, brillo holográfico y seguimiento del puntero.
 * Solo frontend; no usa cámara ni WebXR. CURP se muestra solo enmascarada (`curp_masked`).
 */
export function CredentialCard3D({ player, immersive = false, className = '' }: CredentialCard3DProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [active, setActive] = useState(false);

  const first = str(player.first_name);
  const last = str(player.last_name);
  const jersey = player.jersey_number;
  const jerseyStr = jersey !== null && jersey !== undefined && !Number.isNaN(Number(jersey)) ? String(jersey) : '—';
  const avatar = typeof player.avatar_url === 'string' ? player.avatar_url : '';
  const verified = Boolean(player.is_verified);
  const curpMasked = str(player.curp_masked) || 'No registrada';
  const age = calcAge(player.birth_date);

  const moveTilt = (clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (clientX - r.left) / r.width - 0.5;
    const py = (clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -py * 2 * MAX_TILT_DEG, ry: px * 2 * MAX_TILT_DEG });
  };

  const { rx, ry } = tilt;
  const shineDeg = 115 + ry * 1.2 - rx * 0.6;

  const outerGlow = immersive
    ? 'shadow-[0_18px_60px_rgba(0,0,0,0.65),0_0_80px_rgba(212,175,55,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]'
    : 'shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_60px_rgba(212,175,55,0.1),inset_0_1px_0_rgba(255,255,255,0.06)]';

  return (
    <div
      ref={wrapRef}
      className={`relative mx-auto ${className}`}
      style={{ perspective: '1100px' }}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => {
        setActive(false);
        setTilt({ rx: 0, ry: 0 });
      }}
      onPointerMove={(e) => {
        if (e.pointerType === 'mouse' || e.pointerType === 'pen' || e.pointerType === 'touch') {
          moveTilt(e.clientX, e.clientY);
        }
      }}
    >
      <div
        className={`relative rounded-[1.35rem] ${outerGlow}`}
        style={{
          transform:        `rotateX(${rx}deg) rotateY(${ry}deg)`,
          transformStyle:   'preserve-3d',
          transition:       active ? 'transform 0.12s ease-out' : 'transform 0.55s cubic-bezier(0.2, 0.85, 0.25, 1)',
          willChange:       'transform',
        }}
      >
        <div
          className="relative overflow-hidden rounded-[1.35rem] border border-primary/35 bg-gradient-to-br from-[#0b1428] via-[#0a101c] to-[#060a12]"
          style={{ transform: 'translateZ(0)' }}
        >
          <div
            className="pointer-events-none absolute inset-0 z-20 mix-blend-soft-light opacity-70 motion-reduce:opacity-40"
            style={{
              background: `linear-gradient(${shineDeg}deg,
                transparent 0%,
                rgba(80, 160, 255, 0.07) 18%,
                rgba(212, 175, 55, 0.18) 38%,
                rgba(255, 255, 255, 0.35) 48%,
                rgba(212, 175, 55, 0.12) 58%,
                rgba(100, 200, 255, 0.08) 72%,
                transparent 100%)`,
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 z-[19] opacity-30 motion-reduce:hidden"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 3px)',
            }}
          />

          <div className="pointer-events-none absolute inset-0 z-[18] rounded-[1.35rem] shadow-[inset_0_0_80px_rgba(0,0,0,0.55)]" />

          <div className="relative z-10 p-6 sm:p-7" style={{ transform: 'translateZ(26px)' }}>
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={CLUB_LOGO_URL}
                  alt=""
                  className="h-11 w-11 shrink-0 object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.35)]"
                />
                <div className="min-w-0">
                  <p className="font-label-caps text-[10px] tracking-[0.2em] text-primary/90 truncate">
                    F.C. BARCELONA CUPIDO
                  </p>
                  <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Credencial digital verificada</p>
                </div>
              </div>
              {verified && (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  <MaterialIcon name="verified" size={14} filled />
                  OK
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-5 items-stretch">
              <div className="mx-auto sm:mx-0 shrink-0" style={{ transform: 'translateZ(42px)' }}>
                <div className="relative h-36 w-28 sm:h-40 sm:w-32 rounded-2xl border border-primary/25 bg-[#050810] shadow-[0_12px_32px_rgba(0,0,0,0.5)] overflow-hidden">
                  {avatar ? (
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <MaterialIcon name="person" size={48} className="text-on-surface-variant/35" />
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent py-2 text-center">
                    <span className="font-stat-value text-xl text-primary tabular-nums">#{jerseyStr}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left space-y-4" style={{ transform: 'translateZ(20px)' }}>
                <div>
                  <h2 className="font-display-hero text-2xl sm:text-[1.65rem] text-on-surface leading-tight tracking-tight">
                    {first} <span className="text-primary">{last}</span>
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {age !== null ? `${age} años` : '—'} · {formatBirthEs(player.birth_date)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left text-sm">
                  <div className="rounded-xl border border-outline-variant/20 bg-surface-container/40 px-3 py-2 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/70">Posición</p>
                    <p className="font-medium text-on-surface truncate mt-0.5">{str(player.position) || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-outline-variant/20 bg-surface-container/40 px-3 py-2 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/70">Pie</p>
                    <p className="font-medium text-on-surface mt-0.5">{footLabel(player.dominant_foot)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-primary/80 mb-1">CURP (enmascarada)</p>
                  <p className="font-mono text-sm tracking-[0.15em] text-on-surface break-all">{curpMasked}</p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-[10px] uppercase tracking-[0.25em] text-on-surface-variant/45">
              mueve el dedo o el ratón · tarjeta 3D · sin cámara
            </p>
          </div>
        </div>

        <div
          className="pointer-events-none absolute -bottom-8 left-[10%] right-[10%] h-6 rounded-[50%] bg-black/45 blur-xl motion-reduce:opacity-0"
          style={{
            transform: `translateZ(-40px) rotateX(${rx * 0.35}deg)`,
            opacity:   0.35 + Math.min(Math.hypot(rx, ry) / 90, 0.35),
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}
