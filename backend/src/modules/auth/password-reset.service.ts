import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@config/database';
import { env } from '@config/env';
import { BadRequestError } from '@middlewares/error.middleware';
import { isEmailConfigured, sendMail } from '@shared/services/email.service';
import {
  buildPasswordChangedEmail,
  buildPasswordResetEmail,
} from '@shared/services/email-templates';
import { publicSiteBaseUrl } from '@shared/utils/public-site-url';
import { logger } from '@shared/utils/logger';
import { clearLoginLockout } from './login-lockout';
import type { ResetPasswordInput } from './auth.validation';

const TOKEN_BYTES = 32;

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function resetUrl(rawToken: string): string {
  return `${publicSiteBaseUrl()}/restablecer-password?token=${encodeURIComponent(rawToken)}`;
}

export class PasswordResetService {
  /** Siempre responde igual (no revelar si el correo existe). */
  static async requestReset(email: string): Promise<void> {
    const normalized = email.toLowerCase().trim();
    if (!isEmailConfigured()) {
      throw new BadRequestError(
        'El restablecimiento por correo no está disponible. Contacta al administrador del club.',
      );
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, status, deleted_at')
      .eq('email', normalized)
      .is('deleted_at', null)
      .maybeSingle();

    if (!user || user.status === 'inactive') {
      return;
    }

    PasswordResetService.sendResetEmail(user.id, user.email, user.full_name ?? '');
  }

  static async sendResetEmail(userId: string, email: string, fullName: string): Promise<void> {
    try {
      const rawToken = await PasswordResetService.createToken(userId);
      const link = resetUrl(rawToken);
      const { html, text } = buildPasswordResetEmail({
        fullName,
        link,
        hours: env.PASSWORD_RESET_HOURS,
      });
      await sendMail({
        to:      email,
        subject: 'Restablece tu contraseña — F.C. Barcelona Cupido',
        text,
        html,
      });
      logger.info(`Correo de restablecimiento enviado a ${email}`);
    } catch (err) {
      logger.error(`No se pudo enviar restablecimiento a ${email}: ${(err as Error).message}`);
    }
  }

  /** @deprecated Usar sendResetEmail (await interno). Mantenido por compatibilidad. */
  static queueResetEmail(userId: string, email: string, fullName: string): void {
    void PasswordResetService.sendResetEmail(userId, email, fullName);
  }

  private static async createToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(TOKEN_BYTES).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + env.PASSWORD_RESET_HOURS);

    await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', userId)
      .is('used_at', null);

    const { error } = await supabaseAdmin.from('password_reset_tokens').insert({
      user_id:    userId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });

    if (error) throw new Error(error.message);
    return rawToken;
  }

  static async resetPassword(input: ResetPasswordInput): Promise<void> {
    const token = input.token.trim();
    if (!token) throw new BadRequestError('Enlace inválido');

    const tokenHash = hashToken(token);
    const { data: row, error } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row || row.used_at) throw new BadRequestError('Enlace inválido o ya utilizado');
    if (new Date(row.expires_at) < new Date()) {
      throw new BadRequestError('El enlace ha expirado. Solicita uno nuevo.');
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('id', row.user_id)
      .is('deleted_at', null)
      .single();

    if (!user) throw new BadRequestError('Usuario no encontrado');

    const passwordHash = await bcrypt.hash(input.newPassword, env.BCRYPT_ROUNDS);

    await supabaseAdmin
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id);

    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', row.id);

    await clearLoginLockout(user.id);

    await supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked: true, revoked_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('revoked', false);

    await PasswordResetService.sendPasswordChangedNotice(user.email, user.full_name ?? '');
  }

  static async sendPasswordChangedNotice(email: string, fullName: string): Promise<void> {
    if (!isEmailConfigured()) return;

    const { html, text } = buildPasswordChangedEmail({ fullName });
    try {
      await sendMail({
        to:      email,
        subject: 'Tu contraseña fue actualizada — F.C. Barcelona Cupido',
        text,
        html,
      });
    } catch (err) {
      logger.error(`No se pudo enviar aviso de cambio de contraseña a ${email}: ${(err as Error).message}`);
    }
  }
}
