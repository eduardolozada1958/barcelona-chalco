import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { useAuth } from '@/contexts/AuthContext';
import { MaterialIcon } from '@/components/MaterialIcon';

const passwordRules = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir una mayúscula')
  .regex(/[0-9]/, 'Debe incluir un número');

const schema = z
  .object({
    fullName:        z.string().min(3, 'Mínimo 3 caracteres').max(150),
    email:           z.string().email('Correo inválido'),
    password:        passwordRules,
    confirmPassword: z.string(),
    phone:           z.string().max(30).optional(),
    firstName:       z.string().min(2).max(100),
    lastName:        z.string().min(2).max(100),
    phonePrimary:    z.string().min(7, 'Teléfono principal').max(30),
    relationship:    z.enum(['padre', 'madre', 'tutor', 'tutora', 'abuelo', 'abuela', 'tio', 'tia', 'otro']),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path:    ['confirmPassword'],
  });

type Form = z.infer<typeof schema>;

const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-3 text-on-surface font-body-md outline-none transition-colors placeholder:text-on-surface-variant/40';
const labelClass = 'font-label-caps text-label-caps text-on-surface-variant block mb-2';

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver:      zodResolver(schema),
    defaultValues: { relationship: 'padre' },
  });

  const onSubmit = async (data: Form) => {
    try {
      const result = await registerUser({
        email:         data.email.toLowerCase(),
        password:      data.password,
        fullName:      data.fullName,
        phone:         data.phone?.trim() || undefined,
        firstName:     data.firstName,
        lastName:      data.lastName,
        phonePrimary:  data.phonePrimary,
        relationship:  data.relationship,
      });
      toast.success('Revisa tu correo para activar la cuenta');
      navigate(`/verificar-email?email=${encodeURIComponent(result.email)}`, { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center px-margin-mobile md:px-margin-desktop py-stack-lg relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-start opacity-15">
        <div className="w-[600px] h-[600px] bg-primary rounded-full blur-[120px] mt-[-200px]" />
      </div>

      <main className="z-10 w-full max-w-2xl">
        {/* Header */}
        <header className="mb-stack-lg">
          <h1 className="font-display-hero text-headline-lg-mobile md:text-display-hero text-primary tracking-tighter">
            Registro
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Crea tu cuenta como padre o tutor para acceder a Barcelona Cupido.
          </p>
        </header>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-[#002366]/30 backdrop-blur-md rounded-xl border border-primary/20 p-stack-lg space-y-stack-md relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section: Account */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-stack-md border-b border-outline-variant/20 pb-3">
              <MaterialIcon name="person" className="text-primary" />
              <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface">Cuenta de usuario</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>NOMBRE COMPLETO</label>
                <input className={inputClass} placeholder="Tu nombre completo" {...register('fullName')} />
                {errors.fullName ? <p className="mt-2 text-sm text-error">{errors.fullName.message}</p> : null}
              </div>
              <div>
                <label className={labelClass}>CORREO ELECTRÓNICO</label>
                <input type="email" className={inputClass} placeholder="tu@email.com" {...register('email')} />
                {errors.email ? <p className="mt-2 text-sm text-error">{errors.email.message}</p> : null}
              </div>
              <div>
                <label className={labelClass}>TELÉFONO (OPCIONAL)</label>
                <input className={inputClass} placeholder="+52..." {...register('phone')} />
              </div>
              <div>
                <label className={labelClass}>CONTRASEÑA</label>
                <input type="password" className={inputClass} placeholder="••••••••" {...register('password')} />
                {errors.password ? <p className="mt-2 text-sm text-error">{errors.password.message}</p> : null}
              </div>
              <div>
                <label className={labelClass}>CONFIRMAR CONTRASEÑA</label>
                <input type="password" className={inputClass} placeholder="••••••••" {...register('confirmPassword')} />
                {errors.confirmPassword ? <p className="mt-2 text-sm text-error">{errors.confirmPassword.message}</p> : null}
              </div>
            </div>
          </div>

          {/* Section: Guardian */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-stack-md border-b border-outline-variant/20 pb-3">
              <MaterialIcon name="family_restroom" className="text-primary" />
              <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface">Datos del tutor</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>NOMBRE</label>
                <input className={inputClass} placeholder="Nombre" {...register('firstName')} />
                {errors.firstName ? <p className="mt-2 text-sm text-error">{errors.firstName.message}</p> : null}
              </div>
              <div>
                <label className={labelClass}>APELLIDO</label>
                <input className={inputClass} placeholder="Apellido" {...register('lastName')} />
                {errors.lastName ? <p className="mt-2 text-sm text-error">{errors.lastName.message}</p> : null}
              </div>
              <div>
                <label className={labelClass}>TELÉFONO PRINCIPAL</label>
                <input className={inputClass} placeholder="+52..." {...register('phonePrimary')} />
                {errors.phonePrimary ? <p className="mt-2 text-sm text-error">{errors.phonePrimary.message}</p> : null}
              </div>
              <div>
                <label className={labelClass}>PARENTESCO</label>
                <select className={inputClass} {...register('relationship')}>
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

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="relative z-10 w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <MaterialIcon name="progress_activity" className="animate-spin" size={18} />
            ) : (
              <MaterialIcon name="how_to_reg" size={18} />
            )}
            Registrarme
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </main>
    </div>
  );
}
