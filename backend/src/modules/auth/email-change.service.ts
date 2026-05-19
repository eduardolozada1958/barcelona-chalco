import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@config/database';
import { env } from '@config/env';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from '@middlewares/error.middleware';
import { isEmailConfigured, sendMail } from '@shared/services/email.service';
import {
  buildEmailChangeConfirmEmail,
  buildEmailChangeNoticeEmail,
} from '@shared/services/email-templates';
import { publicSiteBaseUrl } from '@shared/utils/public-site-url';
import { invalidateCachedUser } from '@shared/utils/user-cache';
import { logger } from '@shared/utils/logger';
import { clearLoginLockout } from './login-lockout';

const TOKEN_BYTES = 32;

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function confirmUrl(rawToken: string): string {
  return `${publicSiteBaseUrl()}/confirmar-email?token=${encodeURIComponent(rawToken)}`;
}

export class EmailChangeService {
  static async getPending(userId: string): Promise<{ newEmail: string; expiresAt: string } | null> {
    const { data, error } = await supabaseAdmin
      .from('email_change_tokens')
      .select('new_email, expires_at')
      .eq('user_id', userId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return { newEmail: data.new_email as string, expiresAt: data.expires_at as string };
  }

  static async requestSelf(
    userId: string,
    newEmail: string,
    currentPassword: string,
  ): Promise<{ newEmail: string }> {
    if (!isEmailConfigured()) {
      throw new BadRequestError(
        'El cambio de correo requiere envío de email; configura Brevo o SMTP en el servidor.',
      );
    }

    const normalized = newEmail.toLowerCase().trim();
    const user = await EmailChangeService.loadUser(userId);

    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) throw new UnauthorizedError('Contraseña actual incorrecta');

    await EmailChangeService.prepareAndSend(user, normalized);
    return { newEmail: normalized };
  }

  static async requestByAdmin(
    actorUserId: string,
    targetUserId: string,
    newEmail: string,
  ): Promise<{ newEmail: string }> {
    if (!isEmailConfigured()) {
      throw new BadRequestError(
        'El cambio de correo requiere envío de email; configura Brevo o SMTP en el servidor.',
      );
    }

    if (actorUserId === targetUserId) {
      throw new BadRequestError(
        'Para cambiar tu propio correo usa Mi perfil (requiere tu contraseña actual).',
      );
    }

    const normalized = newEmail.toLowerCase().trim();
    const user = await EmailChangeService.loadUser(targetUserId);
    await EmailChangeService.prepareAndSend(user, normalized);
    return { newEmail: normalized };
  }

  static async confirm(rawToken: string): Promise<{ email: string }> {
    const token = rawToken.trim();
    if (!token) throw new BadRequestError('Enlace inválido');

    const tokenHash = hashToken(token);
    const { data: row, error } = await supabaseAdmin
      .from('email_change_tokens')
      .select('id, user_id, new_email, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row || row.used_at) throw new BadRequestError('Enlace inválido o ya utilizado');
    if (new Date(row.expires_at as string) < new Date()) {
      throw new BadRequestError('El enlace ha expirado. Solicita un nuevo cambio de correo.');
    }

    const newEmail = String(row.new_email).toLowerCase().trim();
    await EmailChangeService.assertEmailAvailable(newEmail, row.user_id as string);

    const { error: updateErr } = await supabaseAdmin
      .from('users')
      .update({ email: newEmail })
      .eq('id', row.user_id)
      .is('deleted_at', null);

    if (updateErr) {
      if (updateErr.code === '23505') throw new ConflictError('Ese correo ya está en uso');
      throw new Error(updateErr.message);
    }

    await supabaseAdmin
      .from('email_change_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', row.id);

    await supabaseAdmin
      .from('email_change_tokens')
      .delete()
      .eq('user_id', row.user_id)
      .is('used_at', null);

    await clearLoginLockout(row.user_id as string);

    await supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked: true, revoked_at: new Date().toISOString() })
      .eq('user_id', row.user_id)
      .eq('revoked', false);

    invalidateCachedUser(row.user_id as string);

    return { email: newEmail };
  }

  private static async loadUser(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, full_name, role')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new BadRequestError('Usuario no encontrado');
    return data;
  }

  private static async assertEmailAvailable(email: string, excludeUserId: string): Promise<void> {
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)
      .neq('id', excludeUserId)
      .maybeSingle();

    if (existing) throw new ConflictError('Ese correo ya está registrado en otra cuenta');
  }

  private static async prepareAndSend(
    user: { id: string; email: string; full_name: string | null },
    newEmail: string,
  ): Promise<void> {
    const currentEmail = String(user.email).toLowerCase();
    if (newEmail === currentEmail) {
      throw new BadRequestError('El nuevo correo es igual al actual');
    }

    await EmailChangeService.assertEmailAvailable(newEmail, user.id);

    const rawToken = crypto.randomBytes(TOKEN_BYTES).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + env.EMAIL_VERIFICATION_HOURS);

    await supabaseAdmin
      .from('email_change_tokens')
      .delete()
      .eq('user_id', user.id)
      .is('used_at', null);

    const { error } = await supabaseAdmin.from('email_change_tokens').insert({
      user_id:    user.id,
      new_email:  newEmail,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });

    if (error) throw new Error(error.message);

    const link = confirmUrl(rawToken);
    const fullName = String(user.full_name ?? '');
    const hours = env.EMAIL_VERIFICATION_HOURS;

    const { html, text } = buildEmailChangeConfirmEmail({ fullName, link, hours, newEmail });
    await sendMail({
      to:      newEmail,
      subject: 'Confirma tu nuevo correo — F.C. Barcelona Cupido',
      text,
      html,
    });

    const notice = buildEmailChangeNoticeEmail({
      fullName,
      oldEmail: currentEmail,
      newEmail,
      hours,
    });
    await sendMail({
      to:      currentEmail,
      subject: 'Solicitud de cambio de correo — F.C. Barcelona Cupido',
      text: notice.text,
      html: notice.html,
    });

    if (process.env.NODE_ENV === 'development') {
      logger.info(`Enlace cambio de correo (dev): ${link}`);
    }
  }
}
