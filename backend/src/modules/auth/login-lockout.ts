import { supabaseAdmin } from '@config/database';
import { ForbiddenError, UnauthorizedError } from '@middlewares/error.middleware';

export const MAX_LOGIN_ATTEMPTS = 5;

export function isLoginLocked(user: {
  failed_login_attempts?: number | null;
  login_locked_at?: string | null;
}): boolean {
  if (user.login_locked_at) return true;
  return (user.failed_login_attempts ?? 0) >= MAX_LOGIN_ATTEMPTS;
}

export function lockedAccountMessage(): string {
  return (
    'Tu cuenta está bloqueada por seguridad tras 5 intentos fallidos. ' +
    'Usa «Olvidé mi contraseña» para recibir un enlace y restablecerla.'
  );
}

export async function assertNotLocked(user: {
  id: string;
  failed_login_attempts?: number | null;
  login_locked_at?: string | null;
}): Promise<void> {
  if (isLoginLocked(user)) {
    throw new ForbiddenError(lockedAccountMessage());
  }
}

export async function recordFailedLogin(userId: string, currentAttempts: number): Promise<never> {
  const next = currentAttempts + 1;
  const patch: Record<string, unknown> = { failed_login_attempts: next };

  if (next >= MAX_LOGIN_ATTEMPTS) {
    patch.login_locked_at = new Date().toISOString();
  }

  await supabaseAdmin.from('users').update(patch).eq('id', userId);

  if (next >= MAX_LOGIN_ATTEMPTS) {
    throw new ForbiddenError(lockedAccountMessage());
  }

  throw new UnauthorizedError('Correo o contraseña incorrectos.');
}

export async function clearLoginLockout(userId: string): Promise<void> {
  await supabaseAdmin
    .from('users')
    .update({ failed_login_attempts: 0, login_locked_at: null })
    .eq('id', userId);
}
