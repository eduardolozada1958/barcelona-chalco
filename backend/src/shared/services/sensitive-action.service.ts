import { createHash, randomInt } from 'node:crypto';
import { env } from '@config/env';
import { supabaseAdmin } from '@config/database';
import { BadRequestError } from '@middlewares/error.middleware';
import { isEmailConfigured, sendMail } from '@shared/services/email.service';
import { logger } from '@shared/utils/logger';

export type SensitiveAction =
  | 'delete_user'
  | 'change_user_email'
  | 'view_parent_contact';

const TTL_MS = 10 * 60_000;

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function generateCode(): string {
  return String(randomInt(100_000, 999_999));
}

export class SensitiveActionService {
  static async sendCode(
    adminUserId: string,
    adminEmail: string,
    action: SensitiveAction,
    targetId?: string,
  ): Promise<void> {
    if (!adminEmail?.trim()) {
      throw new BadRequestError('Tu cuenta no tiene correo para enviar el código de verificación');
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

    const { error } = await supabaseAdmin.from('admin_sensitive_codes').insert({
      user_id:    adminUserId,
      action,
      target_id:  targetId ?? null,
      code_hash:  hashCode(code),
      expires_at: expiresAt,
    });

    if (error) throw new Error(error.message);

    const actionLabel =
      action === 'delete_user'
        ? 'eliminar un usuario'
        : action === 'change_user_email'
          ? 'cambiar el correo de un usuario'
          : 'ver datos de contacto de un padre';

    if (!isEmailConfigured()) {
      throw new BadRequestError(
        'El correo no está configurado en el servidor. No se puede enviar el código de verificación.',
      );
    }

    await sendMail({
      to:      adminEmail,
      subject: 'Código de seguridad — Barcelona Cupido',
      html: `
        <p>Hola,</p>
        <p>Solicitaste confirmar una acción sensible en el panel de administración: <strong>${actionLabel}</strong>.</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p>
        <p>Válido 10 minutos. Si no fuiste tú, ignora este mensaje y revisa quién tiene acceso admin.</p>
      `,
      text: `Código Barcelona Cupido: ${code} (10 min). Acción: ${actionLabel}.`,
    });

    logger.info('Código sensible enviado', { adminUserId, action, targetId: targetId ?? null });
  }

  static async verifyCode(
    adminUserId: string,
    action: SensitiveAction,
    code: string,
    targetId?: string,
  ): Promise<void> {
    const trimmed = code.replace(/\D/g, '').trim();
    if (trimmed.length !== 6) {
      throw new BadRequestError('El código debe tener 6 dígitos');
    }

    let query = supabaseAdmin
      .from('admin_sensitive_codes')
      .select('id, code_hash, expires_at, target_id')
      .eq('user_id', adminUserId)
      .eq('action', action)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (targetId) query = query.eq('target_id', targetId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const row = (data ?? []).find(
      (r) => (r as { code_hash: string }).code_hash === hashCode(trimmed),
    ) as { id: string; target_id?: string | null } | undefined;

    if (!row) {
      throw new BadRequestError('Código inválido o expirado. Solicita uno nuevo.');
    }

    if (targetId && row.target_id && row.target_id !== targetId) {
      throw new BadRequestError('Este código no corresponde a esta acción');
    }

    const { error: upErr } = await supabaseAdmin
      .from('admin_sensitive_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', row.id);

    if (upErr) throw new Error(upErr.message);
  }
}

/** Requiere verificación por correo para admins cuando está activado (por defecto sí en producción). */
export function adminSensitiveVerificationRequired(): boolean {
  const v = process.env.ADMIN_SENSITIVE_VERIFICATION;
  if (v === 'false' || v === '0') return false;
  return env.NODE_ENV === 'production' || v === 'true' || v === '1';
}
