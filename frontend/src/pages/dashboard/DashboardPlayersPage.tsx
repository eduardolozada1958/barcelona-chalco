import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { createPlayerWithDocuments, listPlayersAdmin, type CreatePlayerBody } from '@/api/players';
import { DashboardModal, formActionsClass, formErrorClass, formInputClass, formLabelClass } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

const CATEGORIES: CreatePlayerBody['category'][] = ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20'];

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

export function DashboardPlayersPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const curpPdfRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

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
    onSuccess: () => {
      toast.success('Jugador creado');
      void qc.invalidateQueries({ queryKey: ['players-admin'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setCreateOpen(false);
      reset();
      if (curpPdfRef.current) curpPdfRef.current.value = '';
      if (photoRef.current) photoRef.current.value = '';
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
      heightCm:     h ? parseInt(h, 10) : undefined,
      weightKg:     w ? parseInt(w, 10) : undefined,
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
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Plantilla</h1>
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
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={String(p.id)} className="border-t border-outline-variant/10 hover:bg-surface-container/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center shrink-0 border border-outline-variant/20">
                      <MaterialIcon name="person" className="text-on-surface-variant" size={18} />
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
                    {String(p.status)}
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
                  <Link to={`/dashboard/players/${p.id}`} className="text-primary hover:underline font-label-caps text-label-caps flex items-center gap-1">
                    <MaterialIcon name="visibility" size={14} /> Ver
                  </Link>
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
              <p className="text-[11px] text-on-surface-variant mt-1">Opcional en el alta; el registro oficial del trámite es el PDF de arriba.</p>
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
              <label className={formLabelClass}>Altura (cm)</label>
              <input type="number" className={formInputClass} {...register('heightCm')} />
            </div>
          </div>
          <div>
            <label className={formLabelClass}>Peso (kg)</label>
            <input type="number" className={formInputClass} {...register('weightKg')} />
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
    </div>
  );
}
