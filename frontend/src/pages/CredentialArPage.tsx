import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { motion } from 'framer-motion';

import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/api/types';
import { MaterialIcon } from '@/components/MaterialIcon';
import { CredentialCard3D } from '@/components/CredentialCard3D';

type ValidatePayload = { isValid: boolean; player?: Record<string, unknown> };

/**
 * Vista inmersiva al escanear el QR: tarjeta 3D premium (holograma + inclinación).
 * Sin cámara ni realidad aumentada; solo CSS y React.
 */
export function CredentialArPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

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

  const payload = q.data?.data;
  const ok = Boolean(
    q.data?.success &&
      payload &&
      typeof payload === 'object' &&
      'isValid' in payload &&
      payload.isValid,
  );
  const player = ok && payload && 'player' in payload ? payload.player : undefined;

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden bg-[#030810] text-on-surface">
      {/* Fondo: profundidad sin cámara */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[#0a1628] via-[#050a14] to-black" />
      <div className="pointer-events-none fixed inset-0 opacity-40 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(212,175,55,0.22),transparent_55%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-20 bg-[radial-gradient(ellipse_70%_50%_at_80%_100%,rgba(60,100,180,0.25),transparent_50%)]" />

      <header className="sticky top-0 z-30 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] bg-gradient-to-b from-black/50 to-transparent">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 rounded-full bg-surface-container/85 px-3 py-2 text-sm text-on-surface backdrop-blur-md border border-outline-variant/30"
        >
          <MaterialIcon name="close" size={18} /> Cerrar
        </button>
        {token && (
          <Link
            to={`/credencial/${encodeURIComponent(token)}`}
            className="rounded-full bg-primary/15 px-3 py-2 text-xs font-label-caps text-primary border border-primary/35 backdrop-blur-md"
          >
            Vista estándar
          </Link>
        )}
      </header>

      <div className="relative z-10 flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center px-4 py-10 pb-[max(2rem,env(safe-area-inset-bottom))]">
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
        ) : player ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full max-w-lg"
          >
            <CredentialCard3D player={player} immersive />
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
