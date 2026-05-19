import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '@utils/api-error';

import * as authApi from '@/api/auth';
import { MaterialIcon } from '@/components/MaterialIcon';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function ConfirmEmailChangePage() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'idle');
  const [message, setMessage] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authApi.confirmEmailChange(token);
        if (cancelled) return;
        if (!res.success) throw new Error(res.message ?? 'No se pudo confirmar el correo');
        setNewEmail(String((res.data as { email?: string })?.email ?? ''));
        setStatus('success');
        setMessage(res.message ?? 'Correo actualizado.');
        toast.success('Correo confirmado');
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setMessage(getApiErrorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-margin-mobile md:px-margin-desktop py-stack-lg">
      <div className="w-full max-w-md bg-[#002366]/30 backdrop-blur-md rounded-xl border border-primary/20 p-stack-lg text-center">
        {!token ? (
          <>
            <MaterialIcon name="link_off" className="text-primary text-5xl mb-4" />
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Enlace incompleto</h1>
            <p className="text-on-surface-variant text-sm mb-6">
              Abre el enlace completo que enviamos a tu nuevo correo.
            </p>
          </>
        ) : status === 'loading' ? (
          <>
            <MaterialIcon name="progress_activity" className="text-primary text-5xl mb-4 animate-spin" />
            <p className="text-on-surface-variant">Confirmando tu nuevo correo…</p>
          </>
        ) : status === 'success' ? (
          <>
            <MaterialIcon name="check_circle" className="text-primary text-5xl mb-4" filled />
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Correo actualizado</h1>
            <p className="text-on-surface-variant text-sm mb-2">{message}</p>
            {newEmail ? (
              <p className="text-on-surface text-sm mb-6 break-all">
                Nuevo acceso: <strong className="text-primary">{newEmail}</strong>
              </p>
            ) : null}
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
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">No se pudo confirmar</h1>
            <p className="text-on-surface-variant text-sm mb-6">{message}</p>
            <Link to="/login" className="text-primary font-label-caps hover:underline">
              Ir a iniciar sesión
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
