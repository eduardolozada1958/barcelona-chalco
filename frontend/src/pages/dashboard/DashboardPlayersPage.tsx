import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  createPlayerWithDocuments,
  deletePlayer,
  deletePlayerPhoto,
  listPlayersAdmin,
  updatePlayer,
  uploadPlayerPhoto,
  type CreatePlayerBody,
  type CreatePlayerWithDocumentsData,
  type UpdatePlayerBody,
} from '@/api/players';
import { DashboardRowActions } from '@/components/DashboardRowActions';
import {
  DashboardPageHeader,
  DashboardPageShell,
  DashboardPrimaryButton,
  DashboardTableFrame,
} from '@/components/dashboard/DashboardUi';
import type { ApiResponse } from '@/api/types';
import { DashboardModal, formActionsClass, formErrorClass, formInputClass, formLabelClass } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';
import { playerStatusLabel } from '@/config/labels';
import { VenueLeadersSection } from '@/components/VenueLeadersSection';
import { MatchStatsQuickEdit } from '@/components/MatchStatsQuickEdit';
import { MvpOfWeekPanel } from '@/components/MvpOfWeekPanel';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { PlayerPhysiqueFields } from '@/components/PlayerPhysiqueFields';
import { birthDateIsoFromCurp, birthDateToInputValue } from '@/utils/birth-date';
import {
  defaultPhysiqueFormFields,
  physiqueFieldsFromStored,
  resolveHeightCmFromForm,
  resolveWeightKgFromForm,
  validatePhysiqueFields,
  type PhysiqueFormFields,
} from '@/utils/player-physique';

type PlayerForm = {
  firstName: string;
  lastName: string;
  birthDate: string;
  nationality: string;
  position: string;
  secondaryPosition: string;
  jerseyNumber: string;
  dominantFoot: 'right' | 'left' | 'both';
  sportDescription: string;
  curp: string;
} & PhysiqueFormFields;

type EditPlayerForm = {
  firstName: string;
  lastName: string;
  birthDate: string;
  curp: string;
  status: 'active' | 'inactive';
  isVerified: boolean;
} & PhysiqueFormFields;

export function DashboardPlayersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);
  const curpPdfRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const editPhotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get('crear') === '1') {
      setCreateOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('crear');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const q = useQuery({
    queryKey: ['players-admin'],
    queryFn: () => listPlayersAdmin({ page: 1, limit: 50 }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePlayer(id),
    onSuccess: () => {
      toast.success('Jugador eliminado de la plantilla');
      void qc.invalidateQueries({ queryKey: ['players-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createMut = useMutation({
    mutationFn: (args: { body: CreatePlayerBody; curpPdf: File; photo?: File }) =>
      createPlayerWithDocuments(args.body, { curpPdf: args.curpPdf, photo: args.photo }),
    onSuccess: (res: ApiResponse<CreatePlayerWithDocumentsData>) => {
      const fromPdf = res.data?.curpFilledFromPdf === true;
      toast.success(
        fromPdf
          ? 'Jugador creado. CURP detectada automáticamente en el PDF.'
          : (res.message || 'Jugador creado'),
      );
      void qc.invalidateQueries({ queryKey: ['players-admin'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setCreateOpen(false);
      reset();
      if (curpPdfRef.current) curpPdfRef.current.value = '';
      if (photoRef.current) photoRef.current.value = '';
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePlayerBody }) => updatePlayer(id, body),
    onSuccess: (_res, vars) => {
      toast.success('Jugador actualizado');
      void qc.invalidateQueries({ queryKey: ['players-admin'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      void qc.invalidateQueries({ queryKey: ['player-admin', vars.id] });
      setEditOpen(false);
      setEditRow(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const photoUploadMut = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadPlayerPhoto(id, file),
    onSuccess: (res) => {
      toast.success(res.message || 'Foto actualizada');
      const row = res.data as Record<string, unknown> | undefined;
      if (row?.id) {
        setEditRow((prev) => {
          if (!prev || String(prev.id) !== String(row.id)) return prev;
          return { ...prev, avatar_url: row.avatar_url };
        });
        void qc.invalidateQueries({ queryKey: ['player-admin', String(row.id)] });
      }
      void qc.invalidateQueries({ queryKey: ['players-admin'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      void qc.invalidateQueries({ queryKey: ['player-public'] });
      if (editPhotoRef.current) editPhotoRef.current.value = '';
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const photoDeleteMut = useMutation({
    mutationFn: (id: string) => deletePlayerPhoto(id),
    onSuccess: (res, id) => {
      toast.success(res.message || 'Foto eliminada');
      setEditRow((prev) => {
        if (!prev || String(prev.id) !== id) return prev;
        return { ...prev, avatar_url: null };
      });
      void qc.invalidateQueries({ queryKey: ['player-admin', id] });
      void qc.invalidateQueries({ queryKey: ['players-admin'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      void qc.invalidateQueries({ queryKey: ['player-public'] });
      if (editPhotoRef.current) editPhotoRef.current.value = '';
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PlayerForm>({
    defaultValues: {
      nationality:   'Mexicana',
      dominantFoot:  'right',
      firstName:     '',
      lastName:      '',
      birthDate:     '',
      position:      '',
      secondaryPosition: '',
      jerseyNumber:  '',
      sportDescription: '',
      curp: '',
      ...defaultPhysiqueFormFields,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setEditValue,
    watch: watchEdit,
    control: editControl,
    formState: { errors: editErrors },
  } = useForm<EditPlayerForm>({
    defaultValues: {
      firstName: '',
      lastName: '',
      birthDate: '',
      curp: '',
      status: 'active',
      isVerified: false,
      ...defaultPhysiqueFormFields,
    },
  });

  const openEdit = (p: Record<string, unknown>) => {
    setEditRow(p);
    const hStored = typeof p.height_cm === 'number' ? p.height_cm : null;
    const wStored = typeof p.weight_kg === 'number' ? p.weight_kg : null;
    resetEdit({
      firstName: String(p.first_name ?? ''),
      lastName: String(p.last_name ?? ''),
      birthDate: birthDateToInputValue(p.birth_date),
      curp: typeof p.curp === 'string' ? p.curp : '',
      status: p.status === 'inactive' ? 'inactive' : 'active',
      isVerified: Boolean(p.is_verified),
      ...physiqueFieldsFromStored(hStored, wStored),
    });
    setEditOpen(true);
  };

  const onEditSave = handleSubmitEdit((data) => {
    if (!editRow) return;
    if (!data.birthDate) {
      toast.error('Indica la fecha de nacimiento');
      return;
    }
    const body: UpdatePlayerBody = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      birthDate: data.birthDate,
      status: data.status,
      isVerified: data.isVerified,
    };
    if (user?.role === 'admin') {
      const t = data.curp.trim().toUpperCase().replace(/[^A-Z0-9Ñ]/g, '');
      if (t.length > 0 && t.length !== 18) {
        toast.error('La CURP debe tener 18 caracteres o dejarse vacía');
        return;
      }
      body.curp = t.length === 0 ? null : t;
    }
    const physiqueErr = validatePhysiqueFields(data);
    if (physiqueErr) {
      toast.error(physiqueErr.message);
      return;
    }
    const heightCm = resolveHeightCmFromForm(data);
    const weightKg = resolveWeightKgFromForm(data);
    if (heightCm !== undefined) body.heightCm = heightCm;
    if (weightKg !== undefined) body.weightKg = weightKg;
    updateMut.mutate({ id: String(editRow.id), body });
  });

  const onCreate = handleSubmit((data) => {
    const curpPdf = curpPdfRef.current?.files?.[0];
    if (!curpPdf) {
      toast.error('Debes adjuntar el PDF oficial de la CURP');
      return;
    }
    if (curpPdf.type !== 'application/pdf' && !curpPdf.name.toLowerCase().endsWith('.pdf')) {
      toast.error('El documento de CURP debe ser un archivo PDF');
      return;
    }
    const photoFile = photoRef.current?.files?.[0];
    if (photoFile) {
      const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(photoFile.type);
      if (!ok) {
        toast.error('La foto debe ser PNG, JPEG o WebP');
        return;
      }
    }
    const physiqueErr = validatePhysiqueFields(data);
    if (physiqueErr) {
      toast.error(physiqueErr.message);
      return;
    }
    const jersey = data.jerseyNumber.trim();
    const heightCm = resolveHeightCmFromForm(data);
    const weightKg = resolveWeightKgFromForm(data);
    const curpClean = data.curp.trim().toUpperCase().replace(/[^A-Z0-9Ñ]/g, '');
    const body: CreatePlayerBody = {
      firstName: data.firstName.trim(),
      lastName:  data.lastName.trim(),
      birthDate: data.birthDate,
      nationality: data.nationality.trim() || 'Mexicana',
      position:  data.position.trim(),
      dominantFoot: data.dominantFoot,
      secondaryPosition: data.secondaryPosition.trim() || undefined,
      sportDescription: data.sportDescription.trim() || undefined,
      jerseyNumber: jersey ? parseInt(jersey, 10) : undefined,
      heightCm,
      weightKg,
      curp: curpClean.length === 0 ? undefined : curpClean.length === 18 ? curpClean : undefined,
    };
    if (curpClean.length > 0 && curpClean.length !== 18) {
      toast.error('La CURP debe tener 18 caracteres o dejar el campo vacío');
      return;
    }
    if (body.jerseyNumber !== undefined && (Number.isNaN(body.jerseyNumber) || body.jerseyNumber < 1)) {
      toast.error('Número de camiseta inválido');
      return;
    }
    createMut.mutate({ body, curpPdf, photo: photoFile || undefined });
  });

  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="⚽ Plantilla"
        description={`${rows.length} jugadores registrados`}
        actions={
          <DashboardPrimaryButton onClick={() => setCreateOpen(true)} className="shrink-0 self-start sm:self-auto">
            <MaterialIcon name="person_add" size={18} /> Agregar
          </DashboardPrimaryButton>
        }
      />

      <MvpOfWeekPanel />

      <DashboardTableFrame>
        <table className="min-w-full text-left text-sm w-full">
          <thead className="bg-surface-container border-b border-outline-variant/20">
            <tr>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Jugador</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Estado</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Verificado</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={String(p.id)} className="border-t border-outline-variant/10 hover:bg-surface-container/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar
                      name={`${String(p.first_name)} ${String(p.last_name)}`}
                      avatarUrl={typeof p.avatar_url === 'string' ? p.avatar_url : null}
                      size="sm"
                    />
                    <span className="font-medium text-on-surface">{String(p.first_name)} {String(p.last_name)}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps ${
                    p.status === 'active'
                      ? 'bg-primary/15 text-primary'
                      : 'bg-surface-variant text-on-surface-variant'
                  }`}>
                    <MaterialIcon name={p.status === 'active' ? 'check_circle' : 'pause_circle'} size={12} />
                    {playerStatusLabel(String(p.status))}
                  </span>
                </td>
                <td className="p-4">
                  {p.is_verified ? (
                    <MaterialIcon name="verified" className="text-primary" size={20} filled />
                  ) : (
                    <MaterialIcon name="cancel" className="text-on-surface-variant/40" size={20} />
                  )}
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="text-on-surface-variant hover:text-primary font-label-caps text-label-caps inline-flex items-center gap-1"
                    >
                      <MaterialIcon name="edit" size={14} /> Editar
                    </button>
                    <Link to={`/dashboard/players/${p.id}`} className="text-primary hover:underline font-label-caps text-label-caps inline-flex items-center gap-1">
                      <MaterialIcon name="visibility" size={14} /> Ver
                    </Link>
                    <DashboardRowActions
                      onDelete={() => {
                        const name = `${p.first_name} ${p.last_name}`.trim();
                        if (
                          !window.confirm(
                            `¿Eliminar a ${name} de la plantilla?\n\nYa no aparecerá en listados, asistencia ni cuotas. Esta acción no se puede deshacer desde el panel.`,
                          )
                        ) {
                          return;
                        }
                        deleteMut.mutate(String(p.id));
                      }}
                      deletePending={deleteMut.isPending}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DashboardTableFrame>

      <MatchStatsQuickEdit />

      <VenueLeadersSection
        variant="dashboard"
        limit={12}
        linkPlayerNames
        getPlayerHref={(id) => `/dashboard/players/${id}`}
        footerLink={{ to: '/dashboard/results', label: 'Registrar goles en Resultados →' }}
      />

      <DashboardModal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo jugador" wide>
        <form onSubmit={onCreate} className="space-y-3">
          <p className="text-xs text-on-surface-variant rounded-lg border border-primary/25 bg-primary/5 px-3 py-2">
            <strong className="text-primary">Documentación en el alta:</strong> constancia CURP en PDF (obligatoria) y foto del jugador (opcional). Esto se define aquí, no en &quot;Ver jugador&quot;.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={formLabelClass}>Nombre</label>
              <input className={formInputClass} {...register('firstName', { required: 'Requerido', minLength: 2 })} />
              {errors.firstName && <p className={formErrorClass}>{errors.firstName.message}</p>}
            </div>
            <div>
              <label className={formLabelClass}>Apellidos</label>
              <input className={formInputClass} {...register('lastName', { required: 'Requerido', minLength: 2 })} />
              {errors.lastName && <p className={formErrorClass}>{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={formLabelClass}>Fecha de nacimiento</label>
              <input type="date" className={formInputClass} {...register('birthDate', { required: 'Requerido' })} />
              {errors.birthDate && <p className={formErrorClass}>{errors.birthDate.message}</p>}
            </div>
            <div>
              <label className={formLabelClass}>Nacionalidad</label>
              <input className={formInputClass} {...register('nationality')} />
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant/30 bg-surface-container/50 p-3 space-y-3">
            <h3 className="font-label-caps text-label-caps text-primary flex items-center gap-2">
              <MaterialIcon name="folder_special" size={18} /> Constancia y foto (alta)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={formLabelClass}>Constancia CURP (PDF) <span className="text-primary">*</span></label>
                <input
                  ref={curpPdfRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className={`${formInputClass} py-2 file:mr-3 file:rounded file:border-0 file:bg-primary/20 file:px-3 file:py-1 file:text-xs file:font-label-caps file:text-primary`}
                />
                <p className="text-[11px] text-on-surface-variant mt-1">Solo PDF. Queda archivado; no se sustituye desde el panel.</p>
              </div>
              <div>
                <label className={formLabelClass}>Foto del jugador (opcional)</label>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  className={`${formInputClass} py-2 file:mr-3 file:rounded file:border-0 file:bg-primary/20 file:px-3 file:py-1 file:text-xs file:font-label-caps file:text-primary`}
                />
                <p className="text-[11px] text-on-surface-variant mt-1">PNG, JPEG o WebP.</p>
              </div>
            </div>
            <div>
              <label className={formLabelClass}>CURP en texto (opcional)</label>
              <input
                maxLength={18}
                autoComplete="off"
                className={`${formInputClass} font-mono tracking-wide`}
                placeholder="18 caracteres si la quieres guardar también"
                {...register('curp')}
              />
              <p className="text-[11px] text-on-surface-variant mt-1">
                Opcional: si la dejas vacía y el PDF tiene texto seleccionable (no solo imagen escaneada), intentamos rellenarla desde el archivo.
              </p>
            </div>
          </div>
          <div>
            <label className={formLabelClass}>Posición principal</label>
            <input className={formInputClass} {...register('position', { required: 'Requerido', minLength: 2 })} />
            {errors.position && <p className={formErrorClass}>{errors.position.message}</p>}
          </div>
          <div>
            <label className={formLabelClass}>Posición secundaria (opcional)</label>
            <input className={formInputClass} {...register('secondaryPosition')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={formLabelClass}>Pie dominante</label>
              <select className={formInputClass} {...register('dominantFoot')}>
                <option value="right">Derecho</option>
                <option value="left">Zurdo</option>
                <option value="both">Ambos</option>
              </select>
            </div>
            <div>
              <label className={formLabelClass}>Nº camiseta</label>
              <input type="number" min={1} max={99} className={formInputClass} {...register('jerseyNumber')} />
            </div>
          </div>
          <PlayerPhysiqueFields register={register} watch={watch} setValue={setValue} />
          <div>
            <label className={formLabelClass}>Descripción deportiva (opcional)</label>
            <textarea rows={3} className={formInputClass} {...register('sportDescription')} />
          </div>
          <div className={formActionsClass}>
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-caps text-label-caps">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMut.isPending}
              className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps disabled:opacity-50"
            >
              {createMut.isPending ? 'Guardando…' : 'Crear jugador'}
            </button>
          </div>
        </form>
      </DashboardModal>

      <DashboardModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditRow(null);
        }}
        title="Editar jugador"
        wide
      >
        <form onSubmit={onEditSave} className="space-y-3">
          {editRow ? (
            <p className="text-xs text-on-surface-variant">
              ID: <code className="text-primary">{String(editRow.id)}</code>
            </p>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={formLabelClass}>Nombre</label>
              <input className={formInputClass} {...registerEdit('firstName', { required: 'Requerido', minLength: 2 })} />
              {editErrors.firstName && <p className={formErrorClass}>{editErrors.firstName.message}</p>}
            </div>
            <div>
              <label className={formLabelClass}>Apellidos</label>
              <input className={formInputClass} {...registerEdit('lastName', { required: 'Requerido', minLength: 2 })} />
              {editErrors.lastName && <p className={formErrorClass}>{editErrors.lastName.message}</p>}
            </div>
          </div>
          <div>
            <label className={formLabelClass}>Fecha de nacimiento</label>
            <input type="date" className={formInputClass} {...registerEdit('birthDate', { required: 'Requerida' })} />
            {editErrors.birthDate && <p className={formErrorClass}>{editErrors.birthDate.message}</p>}
            <p className="text-[10px] text-on-surface-variant mt-1">
              Si la credencial mostraba un día menos (ej. 29 en vez de 30), corrígela aquí.
            </p>
          </div>
          {user?.role === 'admin' ? (
            <div>
              <label className={formLabelClass}>CURP</label>
              <input className={formInputClass} maxLength={18} {...registerEdit('curp')} />
              <button
                type="button"
                className="mt-2 text-[11px] font-label-caps text-primary hover:underline"
                onClick={() => {
                  const iso = birthDateIsoFromCurp(watchEdit('curp'));
                  if (!iso) {
                    toast.error('CURP incompleta (18 caracteres)');
                    return;
                  }
                  setEditValue('birthDate', iso);
                  toast.success(`Fecha según CURP: ${iso}`);
                }}
              >
                Usar fecha de la CURP
              </button>
            </div>
          ) : null}
          <div>
            <label className={formLabelClass}>Estado en plantilla</label>
            <select className={formInputClass} {...registerEdit('status', { required: true })}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
            <p className="text-[11px] text-on-surface-variant mt-1">Solo los activos y verificados suelen mostrarse en el sitio público.</p>
          </div>
          <PlayerPhysiqueFields register={registerEdit} watch={watchEdit} setValue={setEditValue} />
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container/40 px-3 py-3">
            <Controller
              name="isVerified"
              control={editControl}
              render={({ field }) => (
                <label htmlFor="edit-is-verified" className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="edit-is-verified"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-variant text-primary focus:ring-primary/40"
                  />
                  <span className="min-w-0 text-sm text-on-surface">
                    <span className="font-label-caps text-label-caps text-primary block mb-1">Verificación</span>
                    <span className="text-on-surface-variant text-xs leading-relaxed block">
                      Marcar guarda fecha y responsable; desmarcar quita la verificación (no borra al jugador).
                    </span>
                  </span>
                </label>
              )}
            />
          </div>
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container/40 p-3 space-y-3">
            <span className="font-label-caps text-label-caps text-primary block">Foto del jugador</span>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="relative shrink-0 mx-auto sm:mx-0">
                {editRow?.avatar_url ? (
                  <img
                    src={String(editRow.avatar_url)}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover border border-outline-variant/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/20">
                    <MaterialIcon name="person" size={36} className="text-on-surface-variant/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  ref={editPhotoRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  className={`${formInputClass} py-2 text-xs file:mr-2 file:rounded file:border-0 file:bg-primary/20 file:px-2 file:py-1 file:text-[10px] file:font-label-caps file:text-primary w-full`}
                />
                <p className="text-[10px] text-on-surface-variant">PNG, JPEG o WebP.</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={photoUploadMut.isPending || !editRow}
                    onClick={() => {
                      const file = editPhotoRef.current?.files?.[0];
                      if (!file || !editRow) {
                        toast.error('Selecciona una imagen');
                        return;
                      }
                      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
                        toast.error('Solo PNG, JPEG o WebP');
                        return;
                      }
                      photoUploadMut.mutate({ id: String(editRow.id), file });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-[11px] disabled:opacity-50 touch-manipulation"
                  >
                    <MaterialIcon name="photo_camera" size={16} />
                    {photoUploadMut.isPending ? 'Subiendo…' : editRow?.avatar_url ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                  {editRow?.avatar_url ? (
                    <button
                      type="button"
                      disabled={photoDeleteMut.isPending || !editRow}
                      onClick={() => {
                        if (!editRow) return;
                        if (!window.confirm('¿Quitar la foto de este jugador?')) return;
                        photoDeleteMut.mutate(String(editRow.id));
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-error/40 text-error font-label-caps text-[11px] hover:bg-error/10 disabled:opacity-50 touch-manipulation"
                    >
                      <MaterialIcon name="delete" size={16} />
                      {photoDeleteMut.isPending ? 'Quitando…' : 'Quitar foto'}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <div className={formActionsClass}>
            <button
              type="button"
              onClick={() => {
                setEditOpen(false);
                setEditRow(null);
              }}
              className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-caps text-label-caps"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateMut.isPending}
              className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps disabled:opacity-50"
            >
              {updateMut.isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </DashboardModal>
    </DashboardPageShell>
  );
}
