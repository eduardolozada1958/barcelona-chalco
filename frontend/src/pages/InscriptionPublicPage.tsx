import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import toast from 'react-hot-toast';

import { createInscriptionPublic } from '@/api/inscriptions';
import { MaterialIcon } from '@/components/MaterialIcon';

const schema = z.object({
  parentFirstName:        z.string().min(2),
  parentLastName:         z.string().min(2),
  parentEmail:            z.string().email(),
  parentPhone:            z.string().min(5),
  parentRelationship:     z.enum(['padre','madre','tutor','tutora','abuelo','abuela','tio','tia','otro']),
  playerFirstName:        z.string().min(2),
  playerLastName:         z.string().min(2),
  playerBirthDate:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  playerNationality:      z.string().min(2),
  playerPosition:         z.string().min(2),
  playerDominantFoot:     z.enum(['right','left','both']),
  playerCategory:         z.string().min(1),
  playerHeightCm:         z.string().optional(),
  playerWeightKg:         z.string().optional(),
  playerPreviousClub:     z.string().optional(),
  playerSportDescription: z.string().optional(),
});

type Form = z.infer<typeof schema>;

const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-3 text-on-surface font-body-md outline-none transition-colors placeholder:text-on-surface-variant/40';
const labelClass = 'font-label-caps text-label-caps text-on-surface-variant block mb-2';

export function InscriptionPublicPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({
    resolver:      zodResolver(schema),
    defaultValues: {
      parentRelationship: 'padre',
      playerNationality:  'Mexicana',
      playerDominantFoot: 'right',
    },
  });

  const mutation = useMutation({
    mutationFn: (body: Form) => {
      const h = body.playerHeightCm?.trim();
      const w = body.playerWeightKg?.trim();
      return createInscriptionPublic({
        ...body,
        playerHeightCm: h ? parseInt(h, 10) : undefined,
        playerWeightKg: w ? parseInt(w, 10) : undefined,
        playerPreviousClub:     body.playerPreviousClub || undefined,
        playerSportDescription: body.playerSportDescription || undefined,
      });
    },
    onSuccess: (res) => {
      if (res.success) { toast.success(res.message ?? 'Solicitud enviada'); reset(); }
      else { toast.error(res.message ?? 'Error'); }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center px-margin-mobile md:px-margin-desktop py-stack-lg relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-start opacity-15">
        <div className="w-[600px] h-[600px] bg-primary rounded-full blur-[120px] mt-[-200px]" />
      </div>

      <main className="z-10 w-full max-w-3xl">
        <header className="mb-stack-lg">
          <h1 className="font-display-hero text-headline-lg-mobile md:text-display-hero text-primary tracking-tighter">
            Contacto
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Envía tu solicitud de inscripción o escríbenos desde aquí. El club revisa cada mensaje y te responderá por los datos que indiques.
          </p>
        </header>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="bg-[#002366]/30 backdrop-blur-md rounded-xl border border-primary/20 p-stack-lg space-y-stack-md relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Tutor section */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-stack-md border-b border-outline-variant/20 pb-3">
              <MaterialIcon name="family_restroom" className="text-primary" />
              <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface">Datos del padre o tutor</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="NOMBRE" error={errors.parentFirstName} {...register('parentFirstName')} />
              <Field label="APELLIDO" error={errors.parentLastName} {...register('parentLastName')} />
              <Field label="CORREO" type="email" error={errors.parentEmail} {...register('parentEmail')} />
              <Field label="TELÉFONO" error={errors.parentPhone} {...register('parentPhone')} />
              <div className="sm:col-span-2">
                <label className={labelClass}>PARENTESCO</label>
                <select className={inputClass} {...register('parentRelationship')}>
                  <option value="padre">Padre</option>
                  <option value="madre">Madre</option>
                  <option value="tutor">Tutor</option>
                  <option value="tutora">Tutora</option>
                  <option value="abuelo">Abuelo</option>
                  <option value="abuela">Abuela</option>
                  <option value="tio">Tío</option>
                  <option value="tia">Tía</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Player section */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-stack-md border-b border-outline-variant/20 pb-3">
              <MaterialIcon name="sports_soccer" className="text-primary" />
              <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface">Datos del jugador</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="NOMBRE" error={errors.playerFirstName} {...register('playerFirstName')} />
              <Field label="APELLIDO" error={errors.playerLastName} {...register('playerLastName')} />
              <Field label="FECHA NACIMIENTO" placeholder="YYYY-MM-DD" error={errors.playerBirthDate} {...register('playerBirthDate')} />
              <Field label="NACIONALIDAD" error={errors.playerNationality} {...register('playerNationality')} />
              <Field label="POSICIÓN" error={errors.playerPosition} {...register('playerPosition')} />
              <div>
                <label className={labelClass}>PIE DOMINANTE</label>
                <select className={inputClass} {...register('playerDominantFoot')}>
                  <option value="right">Derecho</option>
                  <option value="left">Izquierdo</option>
                  <option value="both">Ambos</option>
                </select>
              </div>
              <Field label="CATEGORÍA" placeholder="ej. Sub-13" error={errors.playerCategory} {...register('playerCategory')} />
              <Field label="ALTURA (CM)" placeholder="Opcional" {...register('playerHeightCm')} />
              <Field label="PESO (KG)" placeholder="Opcional" {...register('playerWeightKg')} />
              <Field label="CLUB ANTERIOR" placeholder="Opcional" className="sm:col-span-2" {...register('playerPreviousClub')} />
              <Field label="DESCRIPCIÓN DEPORTIVA" placeholder="Opcional" className="sm:col-span-2" {...register('playerSportDescription')} />
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="relative z-10 w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <MaterialIcon name="progress_activity" className="animate-spin" size={18} />
            ) : (
              <MaterialIcon name="send" size={18} />
            )}
            {mutation.isPending ? 'Enviando…' : 'Enviar Solicitud'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          <Link to="/" className="text-primary hover:underline">← Volver al inicio</Link>
        </p>
      </main>
    </div>
  );
}

/* ── Reusable Field ── */
const Field = forwardRef<HTMLInputElement, {
  label: string;
  error?: { message?: string };
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>>(
  ({ label, error, className = '', ...rest }, ref) => (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      <input ref={ref} className={inputClass} {...rest} />
      {error?.message ? <p className="mt-1 text-xs text-error">{error.message}</p> : null}
    </div>
  )
);
Field.displayName = 'Field';
