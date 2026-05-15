import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { motion } from 'framer-motion';

import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/api/types';
import { MaterialIcon } from '@/components/MaterialIcon';

type ValidatePayload = { isValid: boolean; player?: Record<string, unknown> };

function formatBirthEs(iso: unknown): string {
  if (!iso || typeof iso !== 'string') return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Vista “tipo AR”: cámara a pantalla completa + tarjeta flotante con datos del jugador.
 * Misma API que /credencial/:token. Requiere HTTPS (Cloudflare Pages OK).
 */
export function CredentialArPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camError, setCamError] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['qr-validate-ar', token],
    queryFn: async (): Promise<ApiResponse<ValidatePayload>> => {
      try {
        const { data } = await apiClient.get<ApiResponse<ValidatePayload>>(
          `/qr/validate/${encodeURIComponent(token!)}`
        );
        return data;
      } catch (e) {
        const ax = e as AxiosError<ApiResponse<ValidatePayload>>;
        if (ax.response?.data) return ax.response.data;
        return { success: false, message: ax.message ?? 'Error de red' };
      }
    },
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => undefined);
        }
      } catch {
        if (!cancelled) setCamError('No se pudo acceder a la cámara. Puedes ver la ficha clásica sin cámara.');
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  const payload = q.data?.data;
  const ok = Boolean(
    q.data?.success &&
      payload &&
      typeof payload === 'object' &&
      'isValid' in payload &&
      payload.isValid
  );
  const player = ok && payload && 'player' in payload ? payload.player : undefined;

  return (
    <div className="fixed inset-0 z-[200] bg-black text-on-surface overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover opacity-90"
        autoPlay
        playsInline
        muted
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a1628]/70 via-transparent to-[#0a1628]/90" />

      {/* Top bar */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="pointer-events-auto flex items-center gap-1 rounded-full bg-surface-container/80 px-3 py-2 text-sm text-on-surface backdrop-blur-md border border-outline-variant/30"
        >
          <MaterialIcon name="close" size={18} /> Cerrar
        </button>
        {token && (
          <Link
            to={`/credencial/${encodeURIComponent(token)}`}
            className="pointer-events-auto rounded-full bg-primary/20 px-3 py-2 text-xs font-label-caps text-primary border border-primary/40 backdrop-blur-md"
          >
            Vista clásica
          </Link>
        )}
      </header>

      {camError && (
        <div className="absolute top-20 left-4 right-4 z-20 rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error backdrop-blur-md">
          {camError}
        </div>
      )}

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {q.isLoading ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-surface-container/85 px-10 py-8 backdrop-blur-xl shadow-2xl">
            <MaterialIcon name="progress_activity" className="text-primary animate-spin" size={40} />
            <p className="text-sm text-on-surface-variant">Validando credencial…</p>
          </div>
        ) : !ok ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full rounded-2xl border border-error/40 bg-surface-container/90 p-6 text-center backdrop-blur-xl shadow-2xl"
          >
            <MaterialIcon name="cancel" className="text-error mx-auto" size={48} />
            <p className="mt-4 font-headline-lg-mobile text-on-surface">Credencial no válida</p>
            <p className="mt-2 text-sm text-on-surface-variant">{q.data?.message ?? 'Intenta de nuevo.'}</p>
            <Link to="/credencial" className="mt-6 inline-block text-primary text-sm hover:underline">
              Ver todas las credenciales
            </Link>
          </motion.div>
        ) : (
          <div className="w-full max-w-md [perspective:1200px]">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="[transform-style:preserve-3d]"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
                className="relative rounded-2xl border border-primary/40 bg-gradient-to-br from-[#0f1c38]/95 via-[#0a1628]/95 to-surface-container/95 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl [transform:rotateX(6deg)]"
              >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/25 via-transparent to-primary/10 opacity-80 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <MaterialIcon name="view_in_ar" className="text-primary" size={28} />
                  <span className="font-label-caps text-label-caps text-primary tracking-widest">VALIDACIÓN EN CAMPO</span>
                </div>
                <MaterialIcon name="check_circle" className="text-primary mx-auto mb-3" size={40} filled />
                <p className="text-center text-sm text-primary font-medium mb-4">Credencial verificada</p>

                {player ? (
                  <>
                  <div className="flex items-center gap-4 mb-5 pb-4 border-b border-outline-variant/20">
                    {typeof player.avatar_url === 'string' && player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover border border-primary/30"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant/30">
                        <MaterialIcon name="person" size={32} className="text-on-surface-variant" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-on-surface truncate">
                        {String(player.first_name ?? '')} {String(player.last_name ?? '')}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        #{String(player.jersey_number ?? '—')}
                      </p>
                    </div>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4 border-b border-outline-variant/20 pb-2">
                      <dt className="text-on-surface-variant shrink-0">Nacimiento</dt>
                      <dd className="text-right">{formatBirthEs(player.birth_date)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-outline-variant/20 pb-2">
                      <dt className="text-on-surface-variant shrink-0">CURP</dt>
                      <dd className="font-mono text-xs text-right tracking-wide text-primary">
                        {String(player.curp_masked ?? '—')}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-on-surface-variant shrink-0">Posición</dt>
                      <dd className="text-right truncate max-w-[55%]">{String(player.position ?? '—')}</dd>
                    </div>
                  </dl>
                  </>
                ) : null}

                <p className="mt-6 text-[10px] text-center text-on-surface-variant/70 tracking-widest uppercase">
                  F.C. Barcelona Cupido · vista AR ligera
                </p>
              </div>
            </motion.div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
