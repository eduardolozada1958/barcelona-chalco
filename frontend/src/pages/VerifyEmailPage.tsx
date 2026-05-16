import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import * as authApi from '@/api/auth';
import { MaterialIcon } from '@/components/MaterialIcon';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'idle');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState(params.get('email') ?? '');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authApi.verifyEmail(token);
        if (cancelled) return;
        if (!res.success) throw new Error(res.message ?? 'No se pudo verificar el correo');
        setStatus('success');
        setMessage(res.message ?? 'Correo verificado correctamente.');
        toast.success('Correo verificado');
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setMessage((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = resendEmail.trim().toLowerCase();
    if (!email) {
      toast.error('Indica tu correo');
      return;
    }
    setResending(true);
    try {
      const res = await authApi.resendVerificationEmail(email);
      if (!res.success) throw new Error(res.message);
      toast.success(res.message ?? 'Si el correo está registrado, recibirás un nuevo enlace.');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-margin-mobile md:px-margin-desktop py-stack-lg">
      <div className="w-full max-w-md bg-[#002366]/30 backdrop-blur-md rounded-xl border border-primary/20 p-stack-lg text-center">
        {!token ? (
          <>
            <MaterialIcon name="mark_email_unread" className="text-primary text-5xl mb-4" />
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Verifica tu correo</h1>
            <p className="text-on-surface-variant text-sm mb-6">
              Abre el enlace que enviamos a tu bandeja de entrada (revisa también spam).
            </p>
          </>
        ) : status === 'loading' ? (
          <>
            <MaterialIcon name="progress_activity" className="text-primary text-5xl mb-4 animate-spin" />
            <p className="text-on-surface-variant">Verificando tu correo…</p>
          </>
        ) : status === 'success' ? (
          <>
            <MaterialIcon name="check_circle" className="text-primary text-5xl mb-4" filled />
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">¡Listo!</h1>
            <p className="text-on-surface-variant text-sm mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full bg-primary text-on-primary font-label-caps py-3 rounded-lg"
            >
              Iniciar sesión
            </Link>
          </>
        ) : (
          <>
            <MaterialIcon name="error" className="text-error text-5xl mb-4" />
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Enlace no válido</h1>
            <p className="text-on-surface-variant text-sm mb-6">{message}</p>
          </>
        )}

        <form onSubmit={onResend} className="mt-6 pt-6 border-t border-outline-variant/20 text-left">
          <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">Reenviar enlace</p>
          <input
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface mb-3"
          />
          <button
            type="submit"
            disabled={resending}
            className="w-full border border-primary/40 text-primary font-label-caps py-3 rounded-lg hover:bg-primary/10 disabled:opacity-60"
          >
            {resending ? 'Enviando…' : 'Enviar nuevo enlace'}
          </button>
        </form>
      </div>
    </div>
  );
}
