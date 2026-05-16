import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabaseAdmin } from '@config/database';
import { env } from '@config/env';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from '@middlewares/error.middleware';
import { isEmailConfigured } from '@shared/services/email.service';
import { EmailVerificationService } from './email-verification.service';
import type { LoginInput, RegisterParentInput } from './auth.validation';
import type { JwtPayload } from '@shared/types';

export class AuthService {
  // Login: valida credenciales y devuelve tokens
  static async login(input: LoginInput) {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, role, status, full_name, avatar_url, email_verified')
      .eq('email', input.email.toLowerCase())
      .is('deleted_at', null)
      .single();

    if (error || !user) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const passwordMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    if (user.role === 'parent' && !user.email_verified) {
      throw new UnauthorizedError(
        'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja o solicita un nuevo enlace.',
      );
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError('Cuenta inactiva o suspendida');
    }

    // Actualizar último login
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    const { accessToken, refreshToken } = await AuthService.generateTokens(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id:       user.id,
        email:    user.email,
        role:     user.role,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
      },
    };
  }

  // Registro de padre/tutor con usuario asociado (requiere verificar correo por SMTP)
  static async registerParent(
    input: RegisterParentInput,
  ): Promise<{ email: string; verificationSent: boolean }> {
    if (!isEmailConfigured()) {
      throw new BadRequestError(
        'El registro requiere verificación por correo; el servidor SMTP no está configurado.',
      );
    }

    // Verificar email único
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', input.email.toLowerCase())
      .is('deleted_at', null)
      .single();

    if (existing) {
      throw new ConflictError('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

    // Insertar usuario
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email:         input.email.toLowerCase(),
        password_hash: passwordHash,
        role:           'parent',
        status:         'pending',
        full_name:      input.fullName,
        phone:          input.phone ?? null,
        email_verified: false,
      })
      .select('id, email, role, status, full_name')
      .single();

    if (userError || !newUser) {
      throw new Error('Error al crear usuario');
    }

    // Insertar perfil de padre
    await supabaseAdmin.from('parents').insert({
      user_id:       newUser.id,
      first_name:    input.firstName,
      last_name:     input.lastName,
      phone_primary: input.phonePrimary,
      relationship:  input.relationship,
    });

    await EmailVerificationService.createAndSend(
      newUser.id,
      newUser.email,
      newUser.full_name,
    );

    return {
      email:            newUser.email,
      verificationSent: true,
    };
  }

  static async verifyEmail(token: string): Promise<void> {
    await EmailVerificationService.verify(token);
  }

  static async resendVerificationEmail(email: string): Promise<void> {
    await EmailVerificationService.resend(email);
  }

  // Renovar access token con refresh token
  static async refreshToken(token: string) {
    // Verificar el refresh token
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }

    // Verificar en base de datos
    const tokenHash = AuthService.hashToken(token);
    const { data: storedToken } = await supabaseAdmin
      .from('refresh_tokens')
      .select('id, user_id, expires_at, revoked')
      .eq('token_hash', tokenHash)
      .single();

    if (!storedToken || storedToken.revoked) {
      throw new UnauthorizedError('Refresh token revocado');
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      throw new UnauthorizedError('Refresh token expirado');
    }

    // Obtener usuario actualizado
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, role, status, full_name')
      .eq('id', payload.sub)
      .is('deleted_at', null)
      .single();

    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('Usuario inactivo');
    }

    // Revocar token anterior (rotación de tokens)
    await supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked: true, revoked_at: new Date().toISOString() })
      .eq('id', storedToken.id);

    const tokens = await AuthService.generateTokens(user);
    return tokens;
  }

  // Revocar todos los tokens del usuario
  static async logout(userId: string) {
    await supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked: true, revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('revoked', false);
  }

  // Obtener datos del usuario autenticado
  static async getMe(userId: string) {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, status, full_name, avatar_url, phone, last_login_at, email_verified, created_at')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return user;
  }

  // Genera access token + refresh token y persiste el refresh
  private static async generateTokens(user: { id: string; email: string; role: string }) {
    const payload: JwtPayload = {
      sub:   user.id,
      email: user.email,
      role:  user.role as JwtPayload['role'],
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    // Calcular expiración del refresh token
    const refreshExpiresIn = env.JWT_REFRESH_EXPIRES_IN;
    const days = parseInt(refreshExpiresIn.replace('d', ''), 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Persistir refresh token
    await supabaseAdmin.from('refresh_tokens').insert({
      user_id:    user.id,
      token_hash: AuthService.hashToken(refreshToken),
      expires_at: expiresAt.toISOString(),
    });

    return { accessToken, refreshToken };
  }

  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
