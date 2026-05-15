import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  createPlayerWithDocuments,
  listPlayersAdmin,
  updatePlayer,
  uploadPlayerPhoto,
  type CreatePlayerBody,
  type CreatePlayerWithDocumentsData,
  type UpdatePlayerBody,
} from '@/api/players';
import type { ApiResponse } from '@/api/types';
import { DashboardModal, formActionsClass, formErrorClass, formInputClass, formLabelClass } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';
import { playerStatusLabel } from '@/config/labels';

const CATEGORIES: CreatePlayerBody['category'][] = ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20'];

/** Misma lógica que el backend: cm (175), metros con decimal (1,75), o entero 1–3 como metros (2 → 200). */
function parseHeightCmForBody(raw: string): number | undefined {
  const t = raw.trim().replace(',', '.');
  if (!t) return undefined;
  const n = parseFloat(t);
  if (!Number.isFinite(n)) return undefined;
  const hasDecimal = t.includes('.');
  if (hasDecimal && n > 0 && n < 10) return Math.round(n * 100);
  if (!hasDecimal && Number.isInteger(n) && n >= 1 && n <= 3) return n * 100;
  return Math.round(n);
}

function parseWeightKgForBody(raw: string): number | undefined {
  const t = raw.trim().replace(',', '.');
  if (!t) return undefined;
  const n = parseFloat(t);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n);
}

type PlayerForm = {
  firstName: string;
  lastName: string;
  birthDate: string;
  nationality: string;
  position: string;
  secondaryPosition: string;
  jerseyNumber: string;
  dominantFoot: 'right' | 'left' | 'both';
  heightCm: string;
  weightKg: string;
  category: CreatePlayerBody['category'];
  sportDescription: string;
  curp: string;
};

type EditPlayerForm = {
  firstName: string;
  lastName: string;
  category: CreatePlayerBody['category'];
  status: 'active' | 'inactive';
  isVerified: boolean;
};

export function DashboardPlayersPage() {
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
      if (editPhotoRef.current) editPhotoRef.current.value = '';
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlayerForm>({
    defaultValues: {
      nationality:   'Mexicana',
      dominantFoot:  'right',
      category:      'Sub-17',
      firstName:     '',
      lastName:      '',
      birthDate:     '',
      position:      '',
      secondaryPosition: '',
      jerseyNumber:  '',
      heightCm:      '',
      weightKg:      '',
      sportDescription: '',
      curp: '',
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    control: editControl,
    formState: { errors: editErrors },
  } = useForm<EditPlayerForm>({
    defaultValues: {
      firstName: '',
      lastName: '',
      category: 'Sub-17',
      status: 'active',
      isVerified: false,
    },
  });

  const openEdit = (p: Record<string, unknown>) => {
    setEditRow(p);
    const rawCat = String(p.category ?? 'Sub-17');
    const category = (CATEGORIES as readonly string[]).includes(rawCat)
      ? (rawCat as EditPlayerForm['category'])
      : 'Sub-17';
    resetEdit({
      firstName: String(p.first_name ?? ''),
      lastName: String(p.last_name ?? ''),
      category,
      status: p.status === 'inactive' ? 'inactive' : 'active',
      isVerified: Boolean(p.is_verified),
    });
    setEditOpen(true);
  };

  const onEditSave = handleSubmitEdit((data) => {
    if (!editRow) return;
    updateMut.mutate({
      id: String(editRow.id),
      body: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        category: data.category,
        status: data.status,
        isVerified: data.isVerified,
      },
    });
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
    const jersey = data.jerseyNumber.trim();
    const h = data.heightCm.trim();
    const w = data.weightKg.trim();
    const heightCm = h ? parseHeightCmForBody(h) : undefined;
    const weightKg = w ? parseWeightKgForBody(w) : undefined;
    const curpClean = data.curp.trim().toUpperCase().replace(/[^A-Z0-9Ñ]/g, '');
    const body: CreatePlayerBody = {
      firstName: data.firstName.trim(),
      lastName:  data.lastName.trim(),
      birthDate: data.birthDate,
      nationality: data.nationality.trim() || 'Mexicana',
      position:  data.position.trim(),
      category:  data.category,
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
    if (h && (heightCm === undefined || heightCm < 80 || heightCm > 250)) {
      toast.error('Altura: usa centímetros (ej. 175) o metros con coma/punto (1,75). Enteros 2 o 3 = 2 m / 3 m.');
      return;
    }
    if (w && (weightKg === undefined || weightKg < 15 || weightKg > 150)) {
      toast.error('Peso entre 15 y 150 kg (puedes usar decimales, ej. 70,5).');
      return;
    }
    createMut.mutate({ body, curpPdf, photo: photoFile || undefined });
  });

  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">⚽ Plantilla</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{rows.length} jugadores registrados</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <MaterialIcon name="person_add" size={18} /> Agregar
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-low/50">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-container border-b border-outline-variant/20">
            <tr>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Jugador</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Categoría</th>
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
                    <div className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center shrink-0 border border-outline-variant/20 overflow-hidden">
                      {typeof p.avatar_url === 'string' && p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <MaterialIcon name="person" className="text-on-surface-variant" size={18} />
                      )}
                    </div>
                    <span className="font-medium text-on-surface">{String(p.first_name)} {String(p.last_name)}</span>
                  </div>
                </td>
                <td className="p-4 text-on-surface-variant">{String(p.category)}</td>
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
          <div>
            <label className={formLabelClass}>Categoría</label>
            <select className={formInputClass} {...register('category', { required: true })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
            <div>
              <label className={formLabelClass}>Altura</label>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="175 o 1,75 (metros)"
                className={formInputClass}
                {...register('heightCm')}
              />
              <p className="text-[10px] text-on-surface-variant mt-0.5">En centímetros (175) o en metros (1,75). 2 o 3 sin decimales = 2 m / 3 m.</p>
            </div>
          </div>
          <div>
            <label className={formLabelClass}>Peso (kg)</label>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="ej. 70 o 70,5"
              className={formInputClass}
              {...register('weightKg')}
            />
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={formLabelClass}>Categoría</label>
              <select className={formInputClass} {...registerEdit('category', { required: true })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={formLabelClass}>Estado en plantilla</label>
              <select className={formInputClass} {...registerEdit('status', { required: true })}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
              <p className="text-[11px] text-on-surface-variant mt-1">Solo los activos y verificados suelen mostrarse en el sitio público.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-outline-variant/30 bg-surface-container/40 px-3 py-3">
            <Controller
              name="isVerified"
              control={editControl}
              render={({ field }) => (
                <input
                  type="checkbox"
                  id="edit-is-verified"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/40"
                />
              )}
            />
            <label htmlFor="edit-is-verified" className="text-sm text-on-surface cursor-pointer">
              <span className="font-label-caps text-label-caps text-primary block">Verificación</span>
              <span className="text-on-surface-variant text-xs">Marcar guarda fecha y responsable; desmarcar quita la verificación (no borra al jugador).</span>
            </label>
          </div>
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container/40 p-3 space-y-2">
            <span className="font-label-caps text-label-caps text-primary block">Foto del jugador</span>
            <div className="flex flex-wrap items-end gap-3">
              {editRow?.avatar_url ? (
                <img
                  src={String(editRow.avatar_url)}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover border border-outline-variant/30 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/20 shrink-0">
                  <MaterialIcon name="person" size={32} className="text-on-surface-variant/50" />
                </div>
              )}
              <div className="flex-1 min-w-[200px]">
                <input
                  ref={editPhotoRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  className={`${formInputClass} py-2 text-xs file:mr-2 file:rounded file:border-0 file:bg-primary/20 file:px-2 file:py-1 file:text-[10px] file:font-label-caps file:text-primary`}
                />
                <p className="text-[10px] text-on-surface-variant mt-1">PNG, JPEG o WebP. Actualiza la imagen pública del jugador.</p>
              </div>
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
                className="shrink-0 px-4 py-2 rounded-lg bg-surface-container-high text-on-surface font-label-caps text-[11px] border border-outline-variant/40 hover:border-primary/40 disabled:opacity-50"
              >
                {photoUploadMut.isPending ? 'Subiendo…' : 'Subir foto'}
              </button>
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
    </div>
  );
}
