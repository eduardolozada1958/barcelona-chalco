import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useAuth } from '@/contexts/AuthContext';
import { TotpSecurityPanel } from '@/components/TotpSecurityPanel';
import { MaterialIcon } from '@/components/MaterialIcon';
import { PasswordInput } from '@/components/PasswordInput';
import * as authApi from '@/api/auth';
import * as profileApi from '@/api/profile';
import { getApiErrorMessage } from '@utils/api-error';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Mínimo 2 caracteres').max(150),
  phone:    z.string().max(30).optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Requerida'),
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Al menos una mayúscula')
      .regex(/[0-9]/, 'Al menos un número')
      .regex(/[^A-Za-z0-9]/, 'Al menos un carácter especial'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const ROLE_LABEL: Record<string, string> = {
  admin:  'Administrador',
  coach:  'Entrenador',
  parent: 'Padre / Tutor',
};

export function DashboardAccountPage() {
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangePassword, setEmailChangePassword] = useState('');

  const profileQ = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const res = await authApi.me();
      if (!res.success || !res.data) throw new Error(res.message ?? 'Error al cargar perfil');
      const raw = res.data as Record<string, unknown>;
      const pending = raw.pending_email_change as { newEmail?: string; expiresAt?: string } | null | undefined;
      return {
        ...(raw as unknown as profileApi.UserProfile),
        pending_email_change: pending?.newEmail
          ? { newEmail: pending.newEmail, expiresAt: pending.expiresAt ?? '' }
          : null,
      };
    },
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: profileQ.data?.full_name ?? user?.fullName ?? '',
      phone:    profileQ.data?.phone ?? '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const saveProfile = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await profileApi.updateProfile({
        fullName: data.fullName,
        phone:    data.phone?.trim() || null,
      });
      if (!res.success) throw new Error(res.message ?? 'No se pudo guardar');
      return res.data;
    },
    onSuccess: async () => {
      await refreshUser();
      void qc.invalidateQueries({ queryKey: ['my-profile'] });
      toast.success('Datos guardados');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePwd = useMutation({
    mutationFn: async (data: PasswordForm) => {
      const res = await profileApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
      });
      if (!res.success) throw new Error(res.message ?? 'No se pudo cambiar la contraseña');
    },
    onSuccess: () => {
      passwordForm.reset();
      toast.success('Contraseña actualizada');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadAvatarMut = useMutation({
    mutationFn: async (file: File) => {
      const res = await profileApi.uploadAvatar(file);
      if (!res.success || !res.data) throw new Error(res.message ?? 'Error al subir foto');
      return res.data;
    },
    onSuccess: async (data) => {
      setAvatarPreview(data.avatar_url);
      await refreshUser();
      void qc.invalidateQueries({ queryKey: ['my-profile'] });
      toast.success('Foto actualizada');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const avatarUrl = avatarPreview ?? profileQ.data?.avatar_url ?? null;
  const email = profileQ.data?.email ?? user?.email ?? '';
  const roleLabel = ROLE_LABEL[user?.role ?? ''] ?? user?.role;
  const pendingChange = profileQ.data?.pending_email_change as { newEmail: string } | null | undefined;

  const requestEmailMut = useMutation({
    mutationFn: () =>
      authApi.requestEmailChange({
        newEmail:        newEmail.trim().toLowerCase(),
        currentPassword: emailChangePassword,
      }),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Revisa tu nuevo correo y confirma el enlace');
      setNewEmail('');
      setEmailChangePassword('');
      void qc.invalidateQueries({ queryKey: ['my-profile'] });
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e)),
  });

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo imágenes PNG, JPEG o WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Máximo 5 MB');
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    uploadAvatarMut.mutate(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-stack-lg max-w-2xl">
      <header>
        <h1 className="font-display-hero text-headline-lg-mobile md:text-display-hero text-primary tracking-tight">
          Mi perfil
        </h1>
        <p className="text-on-surface-variant mt-2 font-body-md">
          Correo, contraseña, foto y verificación en dos pasos (opcional).
        </p>
      </header>

      <section className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-stack-md space-y-4">
        <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface flex items-center gap-2">
          <MaterialIcon name="person" className="text-primary" /> Datos de la cuenta
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-stack-md">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-container-highest border-2 border-primary/40 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <MaterialIcon name="person" size={40} className="text-on-surface-variant" />
              )}
            </div>
            {uploadAvatarMut.isPending ? (
              <span className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
                <MaterialIcon name="progress_activity" className="animate-spin text-primary" />
              </span>
            ) : null}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onPickAvatar}
            />
            <button
              type="button"
              disabled={uploadAvatarMut.isPending}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 text-primary font-label-caps text-label-caps hover:bg-primary/10 transition-colors"
            >
              <MaterialIcon name="photo_camera" size={18} />
              {avatarUrl ? 'Cambiar foto' : 'Subir foto'}
            </button>
            <p className="text-sm text-on-surface-variant break-all">
              <span className="font-label-caps text-label-caps block text-on-surface-variant/70 mb-1">Correo</span>
              {email}
            </p>
            <p className="text-xs text-primary font-label-caps uppercase">{roleLabel}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-stack-md">
        <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4 flex items-center gap-2">
          <MaterialIcon name="alternate_email" className="text-primary" size={22} /> Correo de acceso
        </h2>
        {pendingChange?.newEmail ? (
          <p className="text-sm text-on-surface-variant mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            Pendiente de confirmación en <strong className="text-primary break-all">{pendingChange.newEmail}</strong>.
            Revisa ese buzón (y spam) y abre el enlace. También enviamos aviso a <strong>{email}</strong>.
          </p>
        ) : (
          <p className="text-sm text-on-surface-variant mb-4">
            Para cambiar el correo con el que inicias sesión, confirma desde el enlace que enviaremos al nuevo buzón.
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newEmail.trim() || !emailChangePassword) return;
            requestEmailMut.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="newEmail" className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              Nuevo correo
            </label>
            <input
              id="newEmail"
              type="email"
              autoComplete="email"
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface outline-none focus:border-primary"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="emailChangePassword" className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              Contraseña actual (para confirmar)
            </label>
            <input
              id="emailChangePassword"
              type="password"
              autoComplete="current-password"
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface outline-none focus:border-primary"
              value={emailChangePassword}
              onChange={(e) => setEmailChangePassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={requestEmailMut.isPending || !newEmail.trim()}
            className="border border-primary/50 text-primary px-6 py-3 rounded-lg font-label-caps text-label-caps hover:bg-primary/10 disabled:opacity-60"
          >
            {requestEmailMut.isPending ? 'Enviando…' : 'Solicitar cambio de correo'}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-stack-md">
        <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4 flex items-center gap-2">
          <MaterialIcon name="edit" className="text-primary" size={22} /> Información personal
        </h2>
        <form
          onSubmit={profileForm.handleSubmit((d) => saveProfile.mutate(d))}
          className="space-y-4"
        >
          <div>
            <label htmlFor="fullName" className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              Nombre completo
            </label>
            <input
              id="fullName"
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface outline-none focus:border-primary"
              {...profileForm.register('fullName')}
            />
            {profileForm.formState.errors.fullName ? (
              <p className="text-sm text-error mt-1">{profileForm.formState.errors.fullName.message}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="phone" className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              Teléfono (opcional)
            </label>
            <input
              id="phone"
              type="tel"
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface outline-none focus:border-primary"
              {...profileForm.register('phone')}
            />
          </div>
          <button
            type="submit"
            disabled={saveProfile.isPending}
            className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-caps text-label-caps disabled:opacity-60"
          >
            Guardar cambios
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-stack-md">
        <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4 flex items-center gap-2">
          <MaterialIcon name="lock" className="text-primary" size={22} /> Cambiar contraseña
        </h2>
        <form
          onSubmit={passwordForm.handleSubmit((d) => changePwd.mutate(d))}
          className="space-y-4"
        >
          <PasswordInput
            id="currentPassword"
            label="Contraseña actual"
            autoComplete="current-password"
            registration={passwordForm.register('currentPassword')}
            error={passwordForm.formState.errors.currentPassword?.message}
          />
          <PasswordInput
            id="newPassword"
            label="Nueva contraseña"
            registration={passwordForm.register('newPassword')}
            error={passwordForm.formState.errors.newPassword?.message}
            hint="Mín. 8 caracteres, mayúscula, número y símbolo"
          />
          <PasswordInput
            id="confirmPassword"
            label="Confirmar nueva contraseña"
            registration={passwordForm.register('confirmPassword')}
            error={passwordForm.formState.errors.confirmPassword?.message}
          />
          <button
            type="submit"
            disabled={changePwd.isPending}
            className="border border-primary/50 text-primary px-6 py-3 rounded-lg font-label-caps text-label-caps hover:bg-primary/10 disabled:opacity-60"
          >
            Actualizar contraseña
          </button>
        </form>
      </section>

      <TotpSecurityPanel />
    </div>
  );
}
