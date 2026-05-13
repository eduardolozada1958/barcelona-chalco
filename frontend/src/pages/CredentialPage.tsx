import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/api/types';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

type ValidatePayload = { isValid: boolean; player?: Record<string, unknown> };

export function CredentialPage() {
  const { token } = useParams<{ token: string }>();

  const q = useQuery({
    queryKey: ['qr-validate', token],
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
    retry:   false,
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-container-lowest px-4 text-on-surface">
        <p>Token no válido.</p>
      </div>
    );
  }

  if (q.isLoading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest">
        <Spinner label="Validando credencial…" />
      </div>
    );
  }

  const payload = q.data?.data;
  const ok = Boolean(q.data?.success && payload && typeof payload === 'object' && 'isValid' in payload && payload.isValid);
  const player = ok && payload && 'player' in payload ? payload.player : undefined;

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-on-surface">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <MaterialIcon name="qr_code_scanner" className="text-primary" size={48} />
          <h1 className="mt-2 font-headline-lg text-headline-lg">Credencial digital</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Validación pública (escaneo QR)</p>
        </div>

        {!ok ? (
          <div className="rounded-2xl border border-error/40 bg-surface-container/80 p-6 text-center shadow-lg">
            <MaterialIcon name="cancel" className="text-error" size={56} />
            <p className="mt-4 font-medium">Credencial no válida o jugador no verificado</p>
            <p className="mt-2 text-sm text-on-surface-variant">{q.data?.message ?? 'Intenta de nuevo o contacta al club.'}</p>
            <Link to="/" className="mt-6 inline-block text-primary hover:underline">
              Volver al inicio
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-primary/30 bg-surface-container/80 p-6 shadow-lg">
            <MaterialIcon name="check_circle" className="text-primary" size={56} filled />
            <p className="mt-4 text-center font-medium text-primary">Credencial válida</p>
            {player ? (
              <dl className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between border-b border-outline-variant/20 py-2">
                  <dt className="text-on-surface-variant">Nombre</dt>
                  <dd className="font-medium">
                    {String(player.first_name ?? '')} {String(player.last_name ?? '')}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-outline-variant/20 py-2">
                  <dt className="text-on-surface-variant">Categoría</dt>
                  <dd>{String(player.category ?? '—')}</dd>
                </div>
                <div className="flex justify-between border-b border-outline-variant/20 py-2">
                  <dt className="text-on-surface-variant">Posición</dt>
                  <dd>{String(player.position ?? '—')}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-on-surface-variant">Club</dt>
                  <dd>{String(player.club_name ?? 'Academia')}</dd>
                </div>
              </dl>
            ) : null}
            <Link to="/" className="mt-6 block text-center text-sm text-primary hover:underline">
              Volver al inicio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
