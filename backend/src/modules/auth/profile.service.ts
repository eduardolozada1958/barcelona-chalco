import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@config/database';
import { env } from '@config/env';
import {
  BadRequestError,
  UnauthorizedError,
} from '@middlewares/error.middleware';
import { assertImageUpload } from '@shared/utils/file-magic';
import { PasswordResetService } from './password-reset.service';
import type { ChangePasswordInput, UpdateProfileInput } from './auth.validation';

const PROFILE_SELECT =
  'id, email, role, status, full_name, avatar_url, phone, last_login_at, email_verified, created_at, totp_enabled, totp_enabled_at';

function extFromMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export class ProfileService {
  static async updateProfile(userId: string, input: UpdateProfileInput) {
    const updateData: Record<string, unknown> = {};
    if (input.fullName !== undefined) updateData.full_name = input.fullName.trim();
    if (input.phone !== undefined) updateData.phone = input.phone?.trim() || null;

    if (Object.keys(updateData).length === 0) {
      return ProfileService.getProfile(userId);
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .is('deleted_at', null)
      .select(PROFILE_SELECT)
      .single();

    if (error) throw new Error(error.message);

    if (input.phone !== undefined && data?.role === 'parent') {
      await supabaseAdmin
        .from('parents')
        .update({ phone_primary: input.phone?.trim() || '' })
        .eq('user_id', userId)
        .is('deleted_at', null);
    }

    return data;
  }

  static async changePassword(userId: string, input: ChangePasswordInput) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('password_hash, email, full_name')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (!user) throw new BadRequestError('Usuario no encontrado');

    const ok = await bcrypt.compare(input.currentPassword, user.password_hash);
    if (!ok) throw new UnauthorizedError('Contraseña actual incorrecta');

    const passwordHash = await bcrypt.hash(input.newPassword, env.BCRYPT_ROUNDS);
    const { error } = await supabaseAdmin
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', userId);

    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked: true, revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('revoked', false);

    await PasswordResetService.sendPasswordChangedNotice(user.email, user.full_name ?? '');
  }

  static async uploadAvatar(
    userId: string,
    file: { buffer: Buffer; mimetype: string; size: number },
  ) {
    assertImageUpload(file);
    if (file.size > env.STORAGE_MAX_FILE_SIZE) {
      throw new BadRequestError('La imagen supera el tamaño máximo permitido (5 MB)');
    }

    const bucket = env.STORAGE_BUCKET_PLAYERS;
    const objectPath = `users/${userId}/${randomUUID()}.${extFromMime(file.mimetype)}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from(bucket)
      .upload(objectPath, file.buffer, { contentType: file.mimetype, upsert: false });

    if (upErr) throw new Error(upErr.message);

    const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(objectPath);
    const avatarUrl = pub.publicUrl;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)
      .is('deleted_at', null)
      .select(PROFILE_SELECT)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getProfile(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(PROFILE_SELECT)
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new BadRequestError('Usuario no encontrado');
    return data;
  }
}
