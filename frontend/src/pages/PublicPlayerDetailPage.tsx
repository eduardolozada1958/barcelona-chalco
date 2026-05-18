import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { getPlayerPublic } from '@/api/players';
import type { Player } from '@/types';
import { MaterialIcon } from '@/components/MaterialIcon';
import { PlayerQrImage } from '@/components/PlayerQrImage';
import { StatBox } from '@/components/StatBox';
import { Badge } from '@/components/Badge';
import { Spinner } from '@/components/Spinner';
import { isPlayerUuid } from '@/utils/player-path';

/**
 * Player detail page – faithful translation of `perfiljugador.html` mockup.
 * Split layout: image left, stats + bio right. Below: QR identity + verification panel.
 */
export function PublicPlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ['player-public', id],
    queryFn: () => getPlayerPublic(id!),
    enabled: Boolean(id),
  });

  const player = q.data?.data as Player | undefined;

  useEffect(() => {
    if (!player || !id) return;
    const slug = player.slug?.trim();
    if (slug && isPlayerUuid(id) && id !== slug) {
      navigate(`/jugadores/${slug}`, { replace: true });
    }
  }, [player, id, navigate]);

  if (q.isLoading) return <Spinner />;

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <MaterialIcon name="person_off" className="text-on-surface-variant mb-4" size={64} />
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Jugador no encontrado</h2>
        <Link to="/jugadores" className="text-primary font-label-caps text-label-caps hover:underline mt-4">
          ← Volver a jugadores
        </Link>
      </div>
    );
  }

  const fullName = `${player.first_name} ${player.last_name}`;
  const age = player.birth_date ? calculateAge(player.birth_date) : '—';

  return (
    <div className="pt-4 pb-stack-lg px-margin-mobile md:px-margin-desktop w-full max-w-[1280px] mx-auto">
      {/* ═══════ Hero Section ═══════ */}
      <section className="relative w-full rounded-xl overflow-hidden mb-stack-lg bg-surface-container-low shadow-card-deep border border-outline-variant/30 flex flex-col md:flex-row">
        {/* Player Image */}
        <div className="relative w-full md:w-1/2 min-h-[400px] md:min-h-[600px] bg-secondary-container/20 overflow-hidden flex items-end justify-center pt-stack-lg">
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
          {player.avatar_url ? (
            <img
              src={player.avatar_url}
              alt={fullName}
              className="relative z-20 object-contain w-3/4 max-h-[110%] bottom-0 transform scale-110 translate-y-4"
            />
          ) : (
            <div className="relative z-20 flex items-center justify-center w-3/4 h-full">
              <MaterialIcon name="person" className="text-surface-container-high" size={160} />
            </div>
          )}
          {/* Number watermark */}
          <div className="absolute -right-8 bottom-1/4 font-display-hero text-[200px] text-surface-container-high z-0 leading-none select-none opacity-30">
            {player.jersey_number ?? ''}
          </div>
        </div>

        {/* Info panel */}
        <div className="relative w-full md:w-1/2 p-stack-md md:p-stack-lg flex flex-col justify-center z-30 bg-surface-container-lowest/80 backdrop-blur-sm border-l border-outline-variant/10">
          {/* Name + Position + Badges */}
          <div className="mb-stack-md flex justify-between items-start">
            <div>
              <h1 className="font-display-hero text-display-hero text-on-surface mb-2 tracking-tighter">
                {player.first_name.toUpperCase()} <br />
                <span className="text-primary">{player.last_name.toUpperCase()}</span>
              </h1>
              <p className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
                <MaterialIcon name="sports_soccer" className="text-primary" size={16} />
                {player.position?.toUpperCase() || 'JUGADOR'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {player.is_verified && <Badge variant="verified" />}
              <div className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                Temporada {player.season || '2024-2025'}
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-base mb-stack-md">
            <StatBox value={player.height_cm ?? '—'} label="HEIGHT (cm)" />
            <StatBox value={player.weight_kg ?? '—'} label="WEIGHT (kg)" highlight />
            <StatBox value={player.jersey_number ?? '—'} label="NUMBER" />
          </div>

          {/* Personal info */}
          <div className="space-y-4 mb-stack-lg border-t border-b border-outline-variant/20 py-stack-md">
            {[
              { label: 'DATE OF BIRTH', value: player.birth_date ? new Date(player.birth_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : '—' },
              { label: 'AGE', value: age },
              { label: 'CLUB', value: 'Barcelona Cupido' },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className={`flex justify-between items-center ${i < arr.length - 1 ? 'border-b border-outline-variant/10 pb-2' : ''}`}
              >
                <span className="font-label-caps text-[11px] text-on-surface-variant tracking-wider">{row.label}</span>
                <span className="font-body-md text-on-surface font-medium">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Biography */}
          <div className="mb-stack-lg">
            <h3 className="font-label-caps text-label-caps text-primary mb-3 flex items-center gap-2">
              <MaterialIcon name="notes" size={16} /> SPORTS DESCRIPTION
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {player.sport_description || 'Sin descripción deportiva disponible.'}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════ Digital Identity Section ═══════ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg mb-stack-lg">
        {/* QR ID Badge */}
        <div className="bg-[#002366]/40 rounded-[16px] border border-primary/20 backdrop-blur-xl shadow-card-deep p-stack-md flex flex-col relative overflow-hidden group">
          {/* Gloss effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

          <div className="flex justify-between items-center mb-stack-md border-b border-primary/20 pb-4">
            <div className="font-display-hero text-headline-lg-mobile text-primary">ID FUT</div>
            <MaterialIcon name="qr_code_scanner" className="text-primary/50" size={32} filled />
          </div>

          <div className="flex-grow flex items-center justify-center py-stack-lg">
            <div className="w-48 h-48 bg-white p-2 rounded-lg flex items-center justify-center relative shadow-[0_0_30px_rgba(212,175,55,0.15)] select-none [-webkit-touch-callout:none]">
              {player.qr_token ? (
                <PlayerQrImage playerId={player.id} qrToken={player.qr_token} size="lg" className="!w-full !h-full" />
              ) : (
                <MaterialIcon name="qr_code_2" className="text-gray-400" size={120} />
              )}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/80 shadow-[0_0_10px_#d4af37]" />
            </div>
          </div>

          <div className="text-center mt-auto pt-4 border-t border-primary/20">
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">PUBLIC FOLIO</p>
            <p className="font-stat-value text-headline-lg-mobile text-on-surface tracking-widest">
              FCB-{player.jersey_number ?? '00'}
            </p>
          </div>
        </div>

        {/* Verification Panel */}
        <div className="bg-surface-container rounded-xl border border-outline-variant/20 p-stack-lg flex flex-col justify-center items-start shadow-lg">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/30">
            <MaterialIcon name="shield_person" className="text-primary" />
          </div>
          <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-2">Validación de Identidad</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
            Escanee el código QR para verificar la autenticidad de las credenciales del jugador, historial de partidos y estatus de registro activo para la temporada actual.
          </p>
          <div className="w-full bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/30 mb-stack-md flex items-center gap-4">
            <MaterialIcon name="info" className="text-tertiary-fixed-dim" filled />
            <p className="font-body-md text-[14px] text-on-surface">
              Este perfil digital está avalado oficialmente por la mesa directiva de Barcelona Cupido.
            </p>
          </div>
          <Link
            to={player.qr_token ? `/credencial-ar/${player.qr_token}` : '#'}
            className="w-full md:w-auto bg-primary-container text-on-primary-container px-8 py-4 rounded font-label-caps text-label-caps flex items-center justify-center gap-2 hover:shadow-gold-lg hover:bg-primary transition-all duration-300"
          >
            <MaterialIcon name="qr_code_2" size={18} />
            Validar mediante QR
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ── Helper ── */
function calculateAge(birthDate: string): number {
  const today = new Date();
  const bday = new Date(birthDate);
  let age = today.getFullYear() - bday.getFullYear();
  const m = today.getMonth() - bday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) age--;
  return age;
}
