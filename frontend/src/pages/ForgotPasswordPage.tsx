import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { MaterialIcon } from '@/components/MaterialIcon';
import { CLUB_LOGO_URL } from '@/config/club';
import * as authPasswordApi from '@/api/auth-password';
import { getApiErrorMessage } from '@utils/api-error';

const schema = z.object({
  email: z.string().email('Correo inválido'),
});

type Form = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    try {
      const res = await authPasswordApi.forgotPassword(data.email);
      setSent(true);
      toast.success(res.message ?? 'Revisa tu correo');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-margin-mobile py-stack-lg">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src={CLUB_LOGO_URL} alt="" className="w-16 h-16 mx-auto mb-4 object-contain" />
          <h1 className="font-display-hero text-headline-lg text-primary">Olvidé mi contraseña</h1>
          <p className="text-on-surface-variant text-sm mt-2">
            Te enviaremos un enlace al correo registrado para crear una nueva contraseña.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-primary/30 bg-surface-container-low p-6 text-center space-y-4">
            <MaterialIcon name="mark_email_read" className="text-primary mx-auto" size={40} />
            <p className="text-on-surface text-sm">
              Si tu correo está en el sistema, recibirás un mensaje en unos minutos. Revisa también spam.
            </p>
            <Link to="/login" className="text-primary font-medium hover:underline text-sm">
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-6 space-y-4"
          >
            <div>
              <label htmlFor="email" className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface outline-none focus:border-primary"
                {...register('email')}
              />
              {errors.email ? <p className="text-sm text-error mt-1">{errors.email.message}</p> : null}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-caps disabled:opacity-60"
            >
              Enviar enlace
            </button>
            <p className="text-center text-sm">
              <Link to="/login" className="text-primary hover:underline">
                Volver al inicio de sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
