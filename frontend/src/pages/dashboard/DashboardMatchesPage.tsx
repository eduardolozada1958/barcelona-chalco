import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  createMatch,
  listMatchesAdmin,
  updateMatch,
  type CreateMatchBody,
  type UpdateMatchBody,
} from '@/api/matches';
import { listPlayersAdmin } from '@/api/players';
import { DashboardModal, formActionsClass, formErrorClass, formInputClass, formLabelClass } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';
import { CANCHAS_PRESETS, resolveVenueSelection, type VenuePresetId } from '@/config/venues';

/** Partidos sin ramas Sub-XX: una sola categoría lógica en base de datos. */
const MATCH_CATEGORY_GENERAL = 'General';

type MatchForm = {
  title: string;
  opponentName: string;
  matchDateLocal: string;
  venuePreset: VenuePresetId;
  locationOther: string;
  mapsUrlOther: string;
  matchType: NonNullable<CreateMatchBody['matchType']>;
  status: NonNullable<CreateMatchBody['status']>;
  isHome: boolean;
  description: string;
  formationType: '' | 'football_7' | 'football_11';
};

function normalizeLineupFromRow(raw: unknown): string[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

export function DashboardMatchesPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [lineupIds, setLineupIds] = useState<string[]>([]);
  const [lineupModalMatch, setLineupModalMatch] = useState<Record<string, unknown> | null>(null);
  const [lineupEditIds, setLineupEditIds] = useState<string[]>([]);
  const [lineupEditFormation, setLineupEditFormation] = useState<'football_7' | 'football_11'>('football_11');

  useEffect(() => {
    if (searchParams.get('crear') === '1') {
      setCreateOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('crear');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const q = useQuery({
    queryKey: ['matches-admin'],
    queryFn: () => listMatchesAdmin({ page: 1, limit: 40 }),
  });

  const createMut = useMutation({
    mutationFn: (body: CreateMatchBody) => createMatch(body),
    onSuccess: () => {
      toast.success('Partido creado');
      void qc.invalidateQueries({ queryKey: ['matches-admin'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setCreateOpen(false);
      setLineupIds([]);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateLineupMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateMatchBody }) => updateMatch(id, body),
    onSuccess: () => {
      toast.success('Plantilla guardada');
      void qc.invalidateQueries({ queryKey: ['matches-admin'] });
      setLineupModalMatch(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<MatchForm>({
    defaultValues: {
      title: '',
      opponentName: '',
      matchDateLocal: '',
      venuePreset: 'walmart',
      locationOther: '',
      mapsUrlOther: '',
      matchType: 'league',
      status: 'scheduled',
      isHome: true,
      description: '',
      formationType: '',
    },
  });

  const formationWatch = watch('formationType');
  const venuePresetWatch = watch('venuePreset');

  const playersLineupQ = useQuery({
    queryKey: ['players-admin', 'for-lineup-all'],
    queryFn: () => listPlayersAdmin({ page: 1, limit: 200 }),
    enabled: createOpen && Boolean(formationWatch),
  });

  const playersEditLineupQ = useQuery({
    queryKey: ['players-admin', 'for-lineup-edit-all'],
    queryFn: () => listPlayersAdmin({ page: 1, limit: 200 }),
    enabled: Boolean(lineupModalMatch),
  });

  const maxStarters = formationWatch === 'football_7' ? 7 : formationWatch === 'football_11' ? 11 : 0;

  useEffect(() => {
    if (!formationWatch) {
      setLineupIds([]);
      return;
    }
    setLineupIds((prev) => prev.slice(0, maxStarters));
  }, [formationWatch, maxStarters]);

  const playerRowsCreate = useMemo(() => {
    const rows = (playersLineupQ.data?.data ?? []) as Record<string, unknown>[];
    return rows.filter((p) => p.status === 'active');
  }, [playersLineupQ.data?.data]);

  const playerRowsEdit = useMemo(() => {
    const rows = (playersEditLineupQ.data?.data ?? []) as Record<string, unknown>[];
    return rows.filter((p) => p.status === 'active');
  }, [playersEditLineupQ.data?.data]);

  const toggleLineup = (id: string) => {
    if (maxStarters === 0) return;
    setLineupIds((prev) => {
      const i = prev.indexOf(id);
      if (i >= 0) return prev.filter((x) => x !== id);
      if (prev.length >= maxStarters) {
        toast.error(`Máximo ${maxStarters} titulares`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const maxEdit = lineupEditFormation === 'football_7' ? 7 : 11;

  const toggleLineupEdit = (id: string) => {
    setLineupEditIds((prev) => {
      const i = prev.indexOf(id);
      if (i >= 0) return prev.filter((x) => x !== id);
      if (prev.length >= maxEdit) {
        toast.error(`Máximo ${maxEdit} titulares`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const onCreate = handleSubmit((data) => {
    if (!data.matchDateLocal) {
      toast.error('Indica fecha y hora del partido');
      return;
    }
    const matchDate = new Date(data.matchDateLocal).toISOString();
    const resolved = resolveVenueSelection(
      data.venuePreset,
      data.locationOther ?? '',
      data.mapsUrlOther ?? '',
    );
    if (!resolved.location || resolved.location.length < 2) {
      toast.error('Elige una cancha o escribe el nombre de la sede');
      return;
    }
    if (resolved.locationMapsUrl) {
      try {
        const u = new URL(resolved.locationMapsUrl);
        if (u.protocol !== 'https:') throw new Error('not https');
      } catch {
        toast.error('La URL del mapa debe ser https (pega solo el enlace del src del iframe)');
        return;
      }
    }
    const body: CreateMatchBody = {
      title:        data.title.trim(),
      opponentName: data.opponentName.trim(),
      matchDate,
      location:        resolved.location,
      locationMapsUrl: resolved.locationMapsUrl,
      category:     MATCH_CATEGORY_GENERAL,
      matchType:    data.matchType,
      status:       data.status,
      isHome:       data.isHome,
      description:  data.description.trim() || null,
    };
    if (data.formationType) {
      const need = data.formationType === 'football_7' ? 7 : 11;
      if (lineupIds.length !== need) {
        toast.error(`Selecciona exactamente ${need} titulares para ${data.formationType === 'football_7' ? 'Fútbol 7' : 'Fútbol 11'}`);
        return;
      }
      body.formationType = data.formationType;
      body.startingLineup = [...lineupIds];
    }
    createMut.mutate(body);
  });

  const openLineupModal = (m: Record<string, unknown>) => {
    setLineupModalMatch(m);
    const ft = m.formation_type === 'football_7' || m.formation_type === 'football_11' ? m.formation_type : 'football_11';
    setLineupEditFormation(ft);
    setLineupEditIds(normalizeLineupFromRow(m.starting_lineup));
  };

  const saveLineupEdit = () => {
    if (!lineupModalMatch) return;
    const need = lineupEditFormation === 'football_7' ? 7 : 11;
    if (lineupEditIds.length !== need) {
      toast.error(`Debes elegir ${need} titulares`);
      return;
    }
    updateLineupMut.mutate({
      id: String(lineupModalMatch.id),
      body: {
        formationType: lineupEditFormation,
        startingLineup: [...lineupEditIds],
      },
    });
  };

  const clearLineupEdit = () => {
    if (!lineupModalMatch) return;
    updateLineupMut.mutate({
      id: String(lineupModalMatch.id),
      body: { formationType: null, startingLineup: null },
    });
  };

  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Partidos</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Gestión de calendario deportivo</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2"
        >
          <MaterialIcon name="add" size={18} /> Programar
        </button>
      </div>

      <div className="grid gap-stack-sm">
        {rows.map((m) => {
          const status = String(m.status);
          const lineup = normalizeLineupFromRow(m.starting_lineup);
          const ft = m.formation_type === 'football_7' || m.formation_type === 'football_11' ? String(m.formation_type) : '';
          return (
            <div
              key={String(m.id)}
              className="bg-surface-container/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/10 group-hover:bg-primary/10 transition-colors shrink-0">
                  <MaterialIcon name="sports_soccer" className="text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-headline-lg-mobile text-body-lg text-on-surface font-semibold truncate">{String(m.title)}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1"><MaterialIcon name="event" size={14} /> {String(m.match_date).slice(0, 10)}</span>
                    <span className="flex items-center gap-1"><MaterialIcon name="location_on" size={14} /> {String(m.location || '—')}</span>
                    {ft && lineup.length > 0 ? (
                      <span className="flex items-center gap-1 text-primary/90">
                        <MaterialIcon name="groups" size={14} />
                        Titulares {ft === 'football_7' ? 'F7' : 'F11'} ({lineup.length})
                      </span>
                    ) : (
                      <span className="text-on-surface-variant/70 text-xs">Sin plantilla titular</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => openLineupModal(m)}
                  className="px-3 py-1.5 rounded-lg border border-primary/40 text-primary font-label-caps text-[11px] hover:bg-primary/10"
                >
                  Plantilla
                </button>
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-label-caps ${
                  status === 'scheduled' ? 'bg-secondary/15 text-secondary' :
                  status === 'completed' ? 'bg-primary/15 text-primary' :
                  'bg-surface-variant text-on-surface-variant'
                }`}>
                  <MaterialIcon name={status === 'completed' ? 'check_circle' : 'schedule'} size={12} />
                  {status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <DashboardModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setLineupIds([]);
          reset();
        }}
        title="Programar partido"
        wide
      >
        <form onSubmit={onCreate} className="space-y-3">
          <div>
            <label className={formLabelClass}>Título del partido</label>
            <input className={formInputClass} {...register('title', { required: 'Requerido', minLength: 3 })} placeholder="Ej. Academia vs Tigres" />
            {errors.title && <p className={formErrorClass}>{errors.title.message}</p>}
          </div>
          <div>
            <label className={formLabelClass}>Rival</label>
            <input className={formInputClass} {...register('opponentName', { required: 'Requerido', minLength: 2 })} />
            {errors.opponentName && <p className={formErrorClass}>{errors.opponentName.message}</p>}
          </div>
          <div>
            <label className={formLabelClass}>Fecha y hora</label>
            <input type="datetime-local" className={formInputClass} {...register('matchDateLocal', { required: true })} />
          </div>
          <div>
            <label className={formLabelClass}>Sede (cancha)</label>
            <select className={formInputClass} {...register('venuePreset')}>
              {CANCHAS_PRESETS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
              <option value="other">Otra sede…</option>
            </select>
            <p className="text-[10px] text-on-surface-variant mt-1">
              Las tres canchas ya incluyen mapa. Si quieres cambiar enlaces en producción, usa en Cloudflare Pages las variables VITE_VENUE_WALMART_MAP_EMBED_URL, VITE_VENUE_ATLAS_MAP_EMBED_URL y VITE_VENUE_CANCHAS100_MAP_EMBED_URL (solo la URL del src del iframe).
            </p>
          </div>
          {venuePresetWatch === 'other' ? (
            <div className="space-y-2 rounded-lg border border-outline-variant/25 bg-surface-container/30 p-3">
              <div>
                <label className={formLabelClass}>Nombre de la sede</label>
                <input className={formInputClass} {...register('locationOther', { minLength: 2 })} placeholder="Ej. Polideportivo Norte" />
              </div>
              <div>
                <label className={formLabelClass}>URL del mapa embebido (opcional)</label>
                <input
                  className={formInputClass}
                  {...register('mapsUrlOther')}
                  placeholder="https://www.google.com/maps/embed?pb=…"
                />
                <p className="text-[10px] text-on-surface-variant mt-1">Solo el enlace https del atributo src del iframe (Google Maps).</p>
              </div>
            </div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={formLabelClass}>Tipo</label>
              <select className={formInputClass} {...register('matchType')}>
                <option value="league">Liga</option>
                <option value="cup">Copa</option>
                <option value="friendly">Amistoso</option>
                <option value="tournament">Torneo</option>
                <option value="internal">Interno</option>
              </select>
            </div>
            <div>
              <label className={formLabelClass}>Estado</label>
              <select className={formInputClass} {...register('status')}>
                <option value="scheduled">Programado</option>
                <option value="in_progress">En juego</option>
                <option value="completed">Finalizado</option>
                <option value="cancelled">Cancelado</option>
                <option value="postponed">Aplazado</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isHome" className="rounded border-outline-variant" {...register('isHome')} />
            <label htmlFor="isHome" className="text-sm text-on-surface">Partido en casa</label>
          </div>
          <div>
            <label className={formLabelClass}>Descripción (opcional)</label>
            <textarea rows={2} className={formInputClass} {...register('description')} />
          </div>

          <div className="rounded-lg border border-outline-variant/30 bg-surface-container/40 p-3 space-y-3">
            <h3 className="font-label-caps text-label-caps text-primary flex items-center gap-2">
              <MaterialIcon name="groups" size={18} /> Plantilla titular (opcional)
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Elige Fútbol 7 (7 jugadores) o Fútbol 11 (11). Lista: todos los jugadores activos de la plantilla (sin ramas por edad). Orden = orden de selección.
            </p>
            <div>
              <label className={formLabelClass}>Formato</label>
              <select className={formInputClass} {...register('formationType')}>
                <option value="">Sin titulares por ahora</option>
                <option value="football_7">Fútbol 7 — 7 titulares</option>
                <option value="football_11">Fútbol 11 — 11 titulares</option>
              </select>
            </div>
            {formationWatch ? (
              playersLineupQ.isLoading ? (
                <p className="text-sm text-on-surface-variant">Cargando jugadores…</p>
              ) : playerRowsCreate.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No hay jugadores activos en la plantilla.</p>
              ) : (
                <>
                  {lineupIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {lineupIds.map((pid, idx) => {
                        const pl = playerRowsCreate.find((r) => String(r.id) === pid);
                        const label = pl ? `${String(pl.first_name)} ${String(pl.last_name)}`.trim() : pid.slice(0, 8);
                        return (
                          <span key={pid} className="text-[10px] px-2 py-1 rounded bg-primary/15 text-primary border border-primary/30">
                            {idx + 1}. {label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <div className="max-h-48 overflow-y-auto rounded border border-outline-variant/20 divide-y divide-outline-variant/10">
                    {playerRowsCreate.map((p) => {
                      const id = String(p.id);
                      const sel = lineupIds.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleLineup(id)}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-surface-container-high/50 ${
                            sel ? 'bg-primary/10 text-primary' : 'text-on-surface'
                          }`}
                        >
                          <span>
                            {String(p.jersey_number ?? '—')} · {String(p.first_name)} {String(p.last_name)}
                          </span>
                          {sel ? <MaterialIcon name="check_circle" size={16} filled /> : <MaterialIcon name="add_circle_outline" size={16} />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-on-surface-variant">
                    Seleccionados: {lineupIds.length} / {maxStarters}
                  </p>
                </>
              )
            ) : null}
          </div>

          <div className={formActionsClass}>
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-caps text-label-caps">
              Cancelar
            </button>
            <button type="submit" disabled={createMut.isPending} className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps disabled:opacity-50">
              {createMut.isPending ? 'Guardando…' : 'Crear partido'}
            </button>
          </div>
        </form>
      </DashboardModal>

      <DashboardModal
        open={Boolean(lineupModalMatch)}
        onClose={() => setLineupModalMatch(null)}
        title={lineupModalMatch ? `Plantilla · ${String(lineupModalMatch.title)}` : 'Plantilla'}
        wide
      >
        {lineupModalMatch ? (
          <div className="space-y-3">
            <p className="text-xs text-on-surface-variant">
              Titulares desde toda la plantilla activa (sin categorías por edad en partidos).
            </p>
            <div>
              <label className={formLabelClass}>Formato</label>
              <select
                className={formInputClass}
                value={lineupEditFormation}
                onChange={(e) => {
                  const v = e.target.value as 'football_7' | 'football_11';
                  setLineupEditFormation(v);
                  setLineupEditIds((prev) => prev.slice(0, v === 'football_7' ? 7 : 11));
                }}
              >
                <option value="football_7">Fútbol 7 — 7 titulares</option>
                <option value="football_11">Fútbol 11 — 11 titulares</option>
              </select>
            </div>
            {playersEditLineupQ.isLoading ? (
              <p className="text-sm text-on-surface-variant">Cargando jugadores…</p>
            ) : playerRowsEdit.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No hay jugadores activos en esta categoría.</p>
            ) : (
              <>
                {lineupEditIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {lineupEditIds.map((pid, idx) => {
                      const pl = playerRowsEdit.find((r) => String(r.id) === pid);
                      const label = pl ? `${String(pl.first_name)} ${String(pl.last_name)}`.trim() : pid.slice(0, 8);
                      return (
                        <span key={pid} className="text-[10px] px-2 py-1 rounded bg-primary/15 text-primary border border-primary/30">
                          {idx + 1}. {label}
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="max-h-52 overflow-y-auto rounded border border-outline-variant/20 divide-y divide-outline-variant/10">
                  {playerRowsEdit.map((p) => {
                    const id = String(p.id);
                    const sel = lineupEditIds.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleLineupEdit(id)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-surface-container-high/50 ${
                          sel ? 'bg-primary/10 text-primary' : 'text-on-surface'
                        }`}
                      >
                        <span>
                          {String(p.jersey_number ?? '—')} · {String(p.first_name)} {String(p.last_name)}
                        </span>
                        {sel ? <MaterialIcon name="check_circle" size={16} filled /> : <MaterialIcon name="add_circle_outline" size={16} />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-on-surface-variant">
                  Seleccionados: {lineupEditIds.length} / {maxEdit}
                </p>
              </>
            )}
            <div className={formActionsClass}>
              <button
                type="button"
                onClick={clearLineupEdit}
                disabled={updateLineupMut.isPending}
                className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-caps text-label-caps disabled:opacity-50"
              >
                Quitar plantilla
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLineupModalMatch(null)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-caps text-label-caps"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={saveLineupEdit}
                  disabled={updateLineupMut.isPending}
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps disabled:opacity-50"
                >
                  {updateLineupMut.isPending ? 'Guardando…' : 'Guardar plantilla'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </DashboardModal>
    </div>
  );
}
