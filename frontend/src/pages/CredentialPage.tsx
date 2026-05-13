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

type ValidatePayload = { isValid: boolean; player?: Record<string, unknown> };

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Build a masked CURP-like code: first 2 of lastName + first of firstName + YYMMDD */
function buildPartialCurp(firstName: string, lastName: string, birthDate: string): string {
  const ln = lastName.replace(/\s+/g, '').toUpperCase().slice(0, 2);
  const fn = firstName.toUpperCase().charAt(0);
  const d  = new Date(birthDate);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${ln}${fn}${yy}${mm}${dd}`;
}

/** Calculate age from birth date */
function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now   = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/** QR code image URL via free API */
function qrImageUrl(token: string): string {
  const url = `${window.location.origin}/credencial/${token}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(url)}&bgcolor=1a1a2e&color=d4af37&format=png`;
}

/* ------------------------------------------------------------------ */
/*  Credential Card Component                                        */
/* ------------------------------------------------------------------ */

function CredentialCard({ player }: { player: Player }) {
  const age        = calcAge(player.birth_date);
  const partialId  = buildPartialCurp(player.first_name, player.last_name, player.birth_date);
  const hasQr      = Boolean(player.qr_token);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-gradient-to-br from-surface-container via-surface-container to-surface-container-high shadow-lg hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-500">
      {/* Header band */}
      <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MaterialIcon name="verified" size={16} className="text-primary" filled />
          <span className="text-xs font-medium text-primary tracking-wider uppercase">Credencial Oficial</span>
        </div>
        <span className="text-xs text-on-surface-variant font-mono">{partialId}</span>
      </div>

      <div className="p-5 flex gap-5">
        {/* Left: Photo + Jersey */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
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
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-on-surface text-base leading-tight truncate">
            {player.first_name} {player.last_name}
          </h3>
          
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <MaterialIcon name="cake" size={14} className="text-primary/70 flex-shrink-0" />
              <span className="text-on-surface-variant">{age} años</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MaterialIcon name="sports_soccer" size={14} className="text-primary/70 flex-shrink-0" />
              <span className="text-on-surface-variant truncate">{player.position ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MaterialIcon name="category" size={14} className="text-primary/70 flex-shrink-0" />
              <span className="text-on-surface-variant">{player.category ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MaterialIcon name="front_hand" size={14} className="text-primary/70 flex-shrink-0" />
              <span className="text-on-surface-variant">
                {player.dominant_foot === 'right' ? 'Diestro' : player.dominant_foot === 'left' ? 'Zurdo' : 'Ambidiestro'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: QR */}
        <div className="flex flex-col items-center justify-center flex-shrink-0">
          {hasQr ? (
            <Link to={`/credencial/${player.qr_token}`} className="block">
              <img
                src={qrImageUrl(player.qr_token!)}
                alt={`QR ${player.first_name}`}
                className="w-20 h-20 rounded-lg border border-primary/20 hover:border-primary/60 transition-colors"
                loading="lazy"
              />
              <p className="mt-1 text-[10px] text-center text-on-surface-variant/60">Escanear</p>
            </Link>
          ) : (
            <div className="w-20 h-20 rounded-lg bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center">
              <MaterialIcon name="qr_code_2" size={32} className="text-on-surface-variant/30" />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 bg-surface-container-high/50 border-t border-outline-variant/10 flex items-center justify-between">
        <span className="text-[10px] text-on-surface-variant/50 tracking-widest uppercase">FutID Barcelona Chalco</span>
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
            Identidades verificadas de los jugadores de la academia. Escanea el código QR para validar.
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
          <h1 className="mt-2 font-headline-lg text-headline-lg">Resultado de Validación</h1>
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
          <div className="rounded-2xl border border-primary/30 bg-surface-container/80 p-6 shadow-lg">
            <div className="text-center">
              <MaterialIcon name="check_circle" className="text-primary" size={56} filled />
              <p className="mt-4 font-medium text-primary text-lg">Credencial Válida ✓</p>
            </div>
            {player ? (
              <dl className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between border-b border-outline-variant/20 py-2">
                  <dt className="text-on-surface-variant">Nombre</dt>
                  <dd className="font-medium">{String(player.first_name ?? '')} {String(player.last_name ?? '')}</dd>
                </div>
                <div className="flex justify-between border-b border-outline-variant/20 py-2">
                  <dt className="text-on-surface-variant">Categoría</dt>
                  <dd>{String(player.category ?? '—')}</dd>
                </div>
                <div className="flex justify-between border-b border-outline-variant/20 py-2">
                  <dt className="text-on-surface-variant">Posición</dt>
                  <dd>{String(player.position ?? '—')}</dd>
                </div>
                <div className="flex justify-between border-b border-outline-variant/20 py-2">
                  <dt className="text-on-surface-variant">Número</dt>
                  <dd>{String(player.jersey_number ?? '—')}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-on-surface-variant">Club</dt>
                  <dd>Academia Barcelona Chalco</dd>
                </div>
              </dl>
            ) : null}
            <button onClick={() => navigate('/credencial')} className="mt-6 block w-full text-center text-sm text-primary hover:underline">
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
