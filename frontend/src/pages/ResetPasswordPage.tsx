import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { MaterialIcon } from '@/components/MaterialIcon';
import { PasswordInput } from '@/components/PasswordInput';
import { CLUB_LOGO_URL } from '@/config/club';
import * as authPasswordApi from '@/api/auth-password';
import { getApiErrorMessage } from '@utils/api-error';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Al menos una mayúscula')
      .regex(/[0-9]/, 'Al menos un número')
      .regex(/[^A-Za-z0-9]/, 'Al menos un carácter especial'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type Form = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    if (!token) {
      toast.error('Enlace inválido. Solicita uno nuevo desde «Olvidé mi contraseña».');
      return;
    }
    try {
      const res = await authPasswordApi.resetPassword({
        token,
        newPassword: data.newPassword,
      });
      setDone(true);
      toast.success(res.message ?? 'Contraseña actualizada');
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-margin-mobile py-stack-lg">
        <div className="max-w-md text-center space-y-4">
          <MaterialIcon name="link_off" className="text-error mx-auto" size={48} />
          <p className="text-on-surface">Este enlace no es válido o ya expiró.</p>
          <Link to="/olvide-contraseña" className="text-primary font-medium hover:underline">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-margin-mobile py-stack-lg">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src={CLUB_LOGO_URL} alt="" className="w-16 h-16 mx-auto mb-4 object-contain" />
          <h1 className="font-display-hero text-headline-lg text-primary">Nueva contraseña</h1>
        </div>

        {done ? (
          <div className="rounded-xl border border-primary/30 p-6 text-center text-sm text-on-surface-variant">
            Listo. Te enviamos un correo de confirmación. Redirigiendo al inicio de sesión…
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-6 space-y-4"
          >
            <PasswordInput
              id="newPassword"
              label="Nueva contraseña"
              registration={register('newPassword')}
              error={errors.newPassword?.message}
              hint="Mín. 8 caracteres, mayúscula, número y símbolo"
            />
            <PasswordInput
              id="confirmPassword"
              label="Confirmar contraseña"
              registration={register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-caps disabled:opacity-60"
            >
              Guardar contraseña
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
