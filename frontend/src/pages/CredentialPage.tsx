import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { apiClient } from '@/api/client';
import { listPlayersPublic } from '@/api/players';
import type { ApiResponse } from '@/api/types';
import type { Player } from '@/types';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';
import { SkeletonGrid } from '@/components/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/PageTransition';
import { PlayerQrImage } from '@/components/PlayerQrImage';
import { CredentialCard3D } from '@/components/CredentialCard3D';

type ValidatePayload = { isValid: boolean; player?: Record<string, unknown> };

/** Calculate age from birth date; invalid or missing returns null. */
function calcAge(birthDate: string | undefined | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/* ------------------------------------------------------------------ */
/*  Credential Card Component                                        */
/* ------------------------------------------------------------------ */

function CredentialCard({ player }: { player: Player }) {
  const age       = calcAge(player.birth_date);
  const headerRef =
    player.jersey_number != null && !Number.isNaN(Number(player.jersey_number))
      ? `#${player.jersey_number}`
      : `ID·${player.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  const hasQr     = Boolean(player.qr_token);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-gradient-to-br from-surface-container via-surface-container to-surface-container-high shadow-lg hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-500">
      {/* Header band */}
      <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MaterialIcon name="verified" size={16} className="text-primary" filled />
          <span className="text-xs font-medium text-primary tracking-wider uppercase">Credencial Oficial</span>
        </div>
        <span className="text-xs text-on-surface-variant font-mono tracking-tight">{headerRef}</span>
      </div>

      <div className="p-5 flex flex-col md:flex-row gap-5">
        {/* Left: Photo + Jersey */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0 mx-auto md:mx-0">
          <div className="relative w-24 h-28 rounded-xl bg-surface-container-highest border border-outline-variant/30 overflow-hidden flex items-center justify-center">
            {player.avatar_url ? (
              <img src={player.avatar_url} alt={player.first_name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <MaterialIcon name="person" size={40} className="text-on-surface-variant/40" />
              </div>
            )}
            {/* Jersey number badge */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md">
              <span className="text-sm font-bold text-on-primary">
                {player.jersey_number ?? '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Info */}
        <div className="flex-1 min-w-0 w-full text-center md:text-left">
          <h3 className="font-semibold text-on-surface text-lg leading-tight">
            {player.first_name} {player.last_name}
          </h3>
          
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <MaterialIcon name="cake" size={14} className="text-primary/70 flex-shrink-0" />
              <span className="text-on-surface-variant">{age !== null ? `${age} años` : '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MaterialIcon name="sports_soccer" size={14} className="text-primary/70 flex-shrink-0" />
              <span className="text-on-surface-variant truncate">{player.position ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MaterialIcon name="front_hand" size={14} className="text-primary/70 flex-shrink-0" />
              <span className="text-on-surface-variant">
                {player.dominant_foot === 'right' ? 'Diestro' : player.dominant_foot === 'left' ? 'Zurdo' : 'Ambidiestro'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: QR — sin enlace táctil: el QR solo sirve escaneándolo con otra cámara; tocar aquí no navega */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 mx-auto md:mx-0">
          {hasQr ? (
            <div className="flex flex-col items-center">
              <PlayerQrImage playerId={player.id} qrToken={player.qr_token!} size="xl" />
              <p className="mt-3 text-[11px] text-center text-on-surface-variant/75 max-w-[14rem] leading-snug">
                Acerca el teléfono; buena luz. El código es grande a propósito para que sea más fácil de leer.
              </p>
            </div>
          ) : (
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center">
              <MaterialIcon name="qr_code_2" size={40} className="text-on-surface-variant/30" />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 bg-surface-container-high/50 border-t border-outline-variant/10 flex items-center justify-between">
        <span className="text-[10px] text-on-surface-variant/50 tracking-widest uppercase">F.C. BARCELONA CUPIDO</span>
        <div className="flex items-center gap-1">
          {player.is_verified && (
            <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
              <MaterialIcon name="check_circle" size={12} filled />
              Verificado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Credentials Gallery (main view)                                   */
/* ------------------------------------------------------------------ */

function CredentialsGallery() {
  const [search, setSearch] = useState('');

  const q = useQuery({
    queryKey: ['players-credentials', search],
    queryFn: () => listPlayersPublic({ search: search || undefined }),
  });

  const allPlayers = ((q.data?.data ?? []) as Player[]).filter(p => p.is_verified);

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-12 pb-16 px-4 md:px-8 w-full max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/30 bg-surface-container">
            <MaterialIcon name="badge" className="text-primary" size={32} />
          </div>
          <h1 className="font-display-hero text-display-hero text-on-surface">
            Credenciales Deportivas
          </h1>
          <p className="mt-2 text-on-surface-variant max-w-xl mx-auto">
            Identidades verificadas de los jugadores de la academia. Usa la cámara de otro teléfono para escanear el QR; al tocarlo en pantalla no se abre el enlace.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <MaterialIcon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              placeholder="Buscar jugador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface font-body-md py-3 pl-10 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-on-surface-variant/50"
            />
          </div>
        </div>

        {/* Grid */}
        {q.isLoading ? (
          <SkeletonGrid count={6} type="player" />
        ) : allPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MaterialIcon name="badge" className="text-on-surface-variant mb-4" size={64} />
            <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Sin credenciales</p>
            <p className="font-body-md text-on-surface-variant">
              No se encontraron jugadores verificados.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-on-surface-variant mb-6">
              {allPlayers.length} jugador{allPlayers.length !== 1 ? 'es' : ''} verificado{allPlayers.length !== 1 ? 's' : ''}
            </p>
            <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {allPlayers.map((player) => (
                <StaggerItem key={player.id}>
                  <CredentialCard player={player} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </>
        )}

        <div className="mt-12 text-center">
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Validation Result (when scanning QR)                              */
/* ------------------------------------------------------------------ */

function CredentialResult() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

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
    retry: false,
  });

  if (q.isLoading) {
    return (
      <div className="min-h-screen bg-background">
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
          <p className="text-sm text-on-surface-variant mt-1">Tarjeta 3D tras escanear el QR; la CURP solo se muestra enmascarada.</p>
        </div>

        {!ok ? (
          <div className="rounded-2xl border border-error/40 bg-surface-container/80 p-6 text-center shadow-lg">
            <MaterialIcon name="cancel" className="text-error" size={56} />
            <p className="mt-4 font-medium">Credencial no válida o jugador no verificado</p>
            <p className="mt-2 text-sm text-on-surface-variant">{q.data?.message ?? 'Intenta de nuevo o contacta al club.'}</p>
            <button onClick={() => navigate('/credencial')} className="mt-6 inline-block text-primary hover:underline">
              Ver todas las credenciales
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-primary">
              <MaterialIcon name="check_circle" size={22} filled />
              <span className="font-medium text-sm tracking-wide">Credencial válida</span>
            </div>
            {player ? <CredentialCard3D player={player} className="max-w-md" /> : null}
            <button
              type="button"
              onClick={() => navigate('/credencial')}
              className="block w-full text-center text-sm text-primary hover:underline"
            >
              Ver todas las credenciales
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Export – routes to gallery or validation                     */
/* ------------------------------------------------------------------ */

export function CredentialPage() {
  const { token } = useParams<{ token: string }>();
  return token ? <CredentialResult /> : <CredentialsGallery />;
}
