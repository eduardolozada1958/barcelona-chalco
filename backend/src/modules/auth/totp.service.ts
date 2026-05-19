import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import { authenticator } from 'otplib';
import { supabaseAdmin } from '@config/database';
import { env } from '@config/env';
import {
  BadRequestError,
  UnauthorizedError,
} from '@middlewares/error.middleware';
import { encryptTotpSecret, decryptTotpSecret } from '@shared/utils/totp-crypto';

const TOTP_ISSUER = 'FC Barcelona Cupido';
const BACKUP_CODE_COUNT = 8;
const PENDING_LOGIN_PURPOSE = 'totp_pending';

authenticator.options = { window: 1 };

export interface TotpStatus {
  enabled:    boolean;
  enabledAt:  string | null;
}

export interface LoginTokensResult {
  accessToken:  string;
  refreshToken: string;
  user: {
    id:        string;
    email:     string;
    role:      string;
    fullName:  string | null;
    avatarUrl: string | null;
  };
}

interface PendingLoginPayload {
  sub:     string;
  purpose: string;
}

export class TotpService {
  static async getStatus(userId: string): Promise<TotpStatus> {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('totp_enabled, totp_enabled_at')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (!user) {
      throw new BadRequestError('Usuario no encontrado');
    }

    return {
      enabled:   Boolean(user.totp_enabled),
      enabledAt: user.totp_enabled_at ?? null,
    };
  }

  /** Inicia configuración: genera secreto y QR (aún no activo hasta confirmar). */
  static async beginSetup(userId: string, email: string) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('totp_enabled')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (!user) throw new BadRequestError('Usuario no encontrado');
    if (user.totp_enabled) {
      throw new BadRequestError('La verificación en dos pasos ya está activa');
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, TOTP_ISSUER, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { width: 256, margin: 2 });

    await supabaseAdmin
      .from('users')
      .update({
        totp_secret_encrypted: encryptTotpSecret(secret),
        totp_enabled:          false,
        totp_enabled_at:       null,
        totp_backup_codes_hashes: [],
      })
      .eq('id', userId);

    return { otpauthUrl, qrDataUrl, manualSecret: secret };
  }

  /** Confirma el primer código y activa 2FA; devuelve códigos de respaldo (solo una vez). */
  static async confirmSetup(userId: string, code: string): Promise<{ backupCodes: string[] }> {
    const secret = await TotpService.loadPendingSecret(userId);
    if (!TotpService.verifyCode(secret, code)) {
      throw new BadRequestError('Código incorrecto. Revisa la hora de tu teléfono e inténtalo de nuevo.');
    }

    const backupCodes = TotpService.generateBackupCodes();
    const hashes = await Promise.all(
      backupCodes.map((c) => bcrypt.hash(c.replace(/-/g, ''), env.BCRYPT_ROUNDS)),
    );

    await supabaseAdmin
      .from('users')
      .update({
        totp_enabled:             true,
        totp_enabled_at:          new Date().toISOString(),
        totp_backup_codes_hashes: hashes,
      })
      .eq('id', userId);

    return { backupCodes };
  }

  /** Desactiva 2FA (contraseña + código TOTP o código de respaldo). */
  static async disable(
    userId: string,
    password: string,
    code: string,
  ): Promise<void> {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('password_hash, totp_enabled, totp_secret_encrypted, totp_backup_codes_hashes')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (!user?.totp_enabled || !user.totp_secret_encrypted) {
      throw new BadRequestError('La verificación en dos pasos no está activa');
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      throw new UnauthorizedError('Contraseña incorrecta');
    }

    const secret = decryptTotpSecret(user.totp_secret_encrypted);
    const codeOk = TotpService.verifyCode(secret, code);
    const backupOk = !codeOk && await TotpService.consumeBackupCode(
      userId,
      user.totp_backup_codes_hashes as string[],
      code,
    );

    if (!codeOk && !backupOk) {
      throw new BadRequestError('Código de autenticador o de respaldo incorrecto');
    }

    await supabaseAdmin
      .from('users')
      .update({
        totp_secret_encrypted:    null,
        totp_enabled:             false,
        totp_enabled_at:          null,
        totp_backup_codes_hashes: [],
      })
      .eq('id', userId);
  }

  static createPendingLoginToken(userId: string): string {
    return jwt.sign(
      { sub: userId, purpose: PENDING_LOGIN_PURPOSE } satisfies PendingLoginPayload,
      env.JWT_SECRET,
      { expiresIn: '5m' },
    );
  }

  static parsePendingLoginToken(token: string): string {
    let payload: PendingLoginPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as PendingLoginPayload;
    } catch {
      throw new UnauthorizedError('Sesión de verificación expirada. Vuelve a iniciar sesión.');
    }
    if (payload.purpose !== PENDING_LOGIN_PURPOSE || !payload.sub) {
      throw new UnauthorizedError('Token de verificación inválido');
    }
    return payload.sub;
  }

  static async verifyLoginTotp(
    pendingToken: string,
    code: string,
    completeLogin: (userId: string) => Promise<LoginTokensResult>,
  ): Promise<LoginTokensResult> {
    const userId = TotpService.parsePendingLoginToken(pendingToken);

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, totp_enabled, totp_secret_encrypted, totp_backup_codes_hashes, status')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (!user?.totp_enabled || !user.totp_secret_encrypted) {
      throw new UnauthorizedError('Verificación en dos pasos no configurada');
    }
    if (user.status !== 'active') {
      throw new UnauthorizedError('Cuenta inactiva o suspendida');
    }

    const secret = decryptTotpSecret(user.totp_secret_encrypted);
    const totpOk = TotpService.verifyCode(secret, code);
    const backupOk = !totpOk && await TotpService.consumeBackupCode(
      userId,
      user.totp_backup_codes_hashes as string[],
      code,
    );

    if (!totpOk && !backupOk) {
      throw new UnauthorizedError('Código incorrecto');
    }

    return completeLogin(userId);
  }

  private static async loadPendingSecret(userId: string): Promise<string> {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('totp_secret_encrypted, totp_enabled')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (!user?.totp_secret_encrypted) {
      throw new BadRequestError('Primero inicia la configuración de 2FA');
    }
    if (user.totp_enabled) {
      throw new BadRequestError('La verificación en dos pasos ya está activa');
    }

    return decryptTotpSecret(user.totp_secret_encrypted);
  }

  private static verifyCode(secret: string, code: string): boolean {
    const normalized = code.replace(/\s/g, '');
    if (!/^\d{6}$/.test(normalized)) return false;
    return authenticator.verify({ token: normalized, secret });
  }

  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
      const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
    }
    return codes;
  }

  private static normalizeBackupInput(code: string): string {
    return code.replace(/[\s-]/g, '').toUpperCase();
  }

  private static async consumeBackupCode(
    userId: string,
    hashes: string[],
    code: string,
  ): Promise<boolean> {
    const normalized = TotpService.normalizeBackupInput(code);
    if (!/^[A-F0-9]{8}$/.test(normalized)) return false;

    for (let i = 0; i < hashes.length; i++) {
      const match = await bcrypt.compare(normalized, hashes[i]);
      if (!match) continue;

      const next = [...hashes];
      next.splice(i, 1);
      await supabaseAdmin
        .from('users')
        .update({ totp_backup_codes_hashes: next })
        .eq('id', userId);
      return true;
    }
    return false;
  }
}
