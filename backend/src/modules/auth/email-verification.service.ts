import crypto from 'crypto';
import { supabaseAdmin } from '@config/database';
import { env } from '@config/env';
import { BadRequestError } from '@middlewares/error.middleware';
import { sendMail } from '@shared/services/email.service';
import { publicSiteBaseUrl } from '@shared/utils/public-site-url';
import { logger } from '@shared/utils/logger';

const TOKEN_BYTES = 32;

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function verificationUrl(rawToken: string): string {
  return `${publicSiteBaseUrl()}/verificar-email?token=${encodeURIComponent(rawToken)}`;
}

export class EmailVerificationService {
  /** Crea token en BD y devuelve el valor en claro para el enlace. */
  static async createToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(TOKEN_BYTES).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + env.EMAIL_VERIFICATION_HOURS);

    await supabaseAdmin
      .from('email_verification_tokens')
      .delete()
      .eq('user_id', userId)
      .is('used_at', null);

    const { error } = await supabaseAdmin.from('email_verification_tokens').insert({
      user_id:    userId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });

    if (error) throw new Error(error.message);
    return rawToken;
  }

  static async sendVerificationMessage(
    email: string,
    fullName: string,
    rawToken: string,
  ): Promise<void> {
    const link = verificationUrl(rawToken);
    const name = fullName.trim() || 'padre o tutor';

    await sendMail({
      to:      email,
      subject: 'Confirma tu correo — F.C. Barcelona Cupido',
      text:    `Hola ${name},\n\nGracias por registrarte. Abre este enlace para confirmar tu correo (válido ${env.EMAIL_VERIFICATION_HOURS} h):\n\n${link}\n\nSi no creaste esta cuenta, ignora este mensaje.`,
      html:    `
        <p>Hola <strong>${escapeHtml(name)}</strong>,</p>
        <p>Gracias por registrarte en <strong>F.C. Barcelona Cupido</strong>.</p>
        <p>Pulsa el botón para confirmar tu correo (enlace válido ${env.EMAIL_VERIFICATION_HOURS} horas):</p>
        <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#D4AF37;color:#000;text-decoration:none;border-radius:8px;font-weight:bold">Confirmar correo</a></p>
        <p style="font-size:12px;color:#666">O copia este enlace: ${escapeHtml(link)}</p>
        <p style="font-size:12px;color:#666">Si no creaste esta cuenta, ignora este correo.</p>
      `,
    });

    if (process.env.NODE_ENV === 'development') {
      logger.info(`Enlace de verificación (dev): ${link}`);
    }
  }

  /** Respuesta HTTP rápida: el correo se envía en segundo plano. */
  static queueVerificationEmail(userId: string, email: string, fullName: string): void {
    void (async () => {
      try {
        const rawToken = await EmailVerificationService.createToken(userId);
        await EmailVerificationService.sendVerificationMessage(email, fullName, rawToken);
        logger.info(`Correo de verificación enviado a ${email}`);
      } catch (err) {
        logger.error(`No se pudo enviar verificación a ${email}: ${(err as Error).message}`);
      }
    })();
  }

  static async createAndSend(userId: string, email: string, fullName: string): Promise<void> {
    const rawToken = await EmailVerificationService.createToken(userId);
    await EmailVerificationService.sendVerificationMessage(email, fullName, rawToken);
  }

  static async verify(rawToken: string): Promise<void> {
    const token = rawToken.trim();
    if (!token) throw new BadRequestError('Token inválido');

    const tokenHash = hashToken(token);
    const { data: row, error } = await supabaseAdmin
      .from('email_verification_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row || row.used_at) throw new BadRequestError('Enlace inválido o ya utilizado');
    if (new Date(row.expires_at) < new Date()) {
      throw new BadRequestError('El enlace ha expirado. Solicita uno nuevo.');
    }

    const { error: userErr } = await supabaseAdmin
      .from('users')
      .update({
        email_verified: true,
        status:         'active',
      })
      .eq('id', row.user_id);

    if (userErr) throw new Error(userErr.message);

    await supabaseAdmin
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', row.id);
  }

  /** Reenvía solo si existe un padre sin verificar (respuesta genérica en el controlador). */
  static async resend(email: string): Promise<boolean> {
    const normalized = email.toLowerCase().trim();
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, email_verified')
      .eq('email', normalized)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!user || user.role !== 'parent' || user.email_verified) return false;

    EmailVerificationService.queueVerificationEmail(
      user.id,
      user.email,
      String(user.full_name ?? ''),
    );
    return true;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
