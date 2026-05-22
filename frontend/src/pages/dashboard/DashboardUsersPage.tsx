import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  createUser,
  deleteUser,
  isUserLoginLocked,
  listUsers,
  requestUserEmailChange,
  sendUserDeleteCode,
  sendUserEmailChangeCode,
  unlockUserLogin,
  updateUser,
  type CreateUserBody,
} from '@/api/users';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardModal, formActionsClass, formErrorClass, formInputClass, formLabelClass } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';
import { userRoleLabel, userStatusLabel } from '@/config/labels';
import { getApiErrorMessage } from '@utils/api-error';

type CreateUserForm = {
  email: string;
  password: string;
  fullName: string;
  role: CreateUserBody['role'];
};

const STATUS_OPTIONS = ['active', 'inactive', 'suspended', 'pending'] as const;

type RoleFilter = 'all' | 'parent' | 'coach' | 'admin';

export function DashboardUsersPage() {
  const { user: sessionUser } = useAuth();
  const qc = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [manageUser, setManageUser] = useState<Record<string, unknown> | null>(null);
  const [manageStatus, setManageStatus] = useState<string>('active');
  const [manageNewEmail, setManageNewEmail] = useState('');
  const [manageVerifyCode, setManageVerifyCode] = useState('');

  const q = useQuery({
    queryKey: ['users-admin', roleFilter],
    queryFn: () =>
      listUsers({
        page:  1,
        limit: 80,
        ...(roleFilter !== 'all' ? { role: roleFilter } : {}),
      }),
  });

  const createMut = useMutation({
    mutationFn: (body: CreateUserBody) => createUser(body),
    onSuccess: () => {
      toast.success('Usuario creado');
      void qc.invalidateQueries({ queryKey: ['users-admin'] });
      setCreateOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unlockMut = useMutation({
    mutationFn: (id: string) => unlockUserLogin(id),
    onSuccess: () => {
      toast.success('Cuenta desbloqueada');
      void qc.invalidateQueries({ queryKey: ['users-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateUser(id, { status }),
    onSuccess: (_res, vars) => {
      toast.success('Estado actualizado');
      void qc.invalidateQueries({ queryKey: ['users-admin'] });
      setManageUser((u) => (u ? { ...u, status: vars.status } : null));
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e)),
  });

  const emailChangeMut = useMutation({
    mutationFn: ({ id, newEmail, verificationCode }: { id: string; newEmail: string; verificationCode?: string }) =>
      requestUserEmailChange(id, newEmail, verificationCode),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Enlace enviado al nuevo correo');
      setManageNewEmail('');
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e)),
  });

  const sendDeleteCodeMut = useMutation({
    mutationFn: (id: string) => sendUserDeleteCode(id),
    onSuccess: (res) => toast.success(res.message ?? 'Código enviado a tu correo'),
    onError: (e: Error) => toast.error(getApiErrorMessage(e)),
  });

  const sendEmailCodeMut = useMutation({
    mutationFn: (id: string) => sendUserEmailChangeCode(id),
    onSuccess: (res) => toast.success(res.message ?? 'Código enviado a tu correo'),
    onError: (e: Error) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) => deleteUser(id, code),
    onSuccess: () => {
      toast.success('Usuario eliminado');
      setManageUser(null);
      void qc.invalidateQueries({ queryKey: ['users-admin'] });
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e)),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserForm>({
    defaultValues: { email: '', password: '', fullName: '', role: 'coach' },
  });

  const onCreate = handleSubmit((data) => {
    createMut.mutate({
      email:    data.email.trim(),
      password: data.password,
      fullName: data.fullName.trim(),
      role:     data.role,
    });
  });

  const openManage = (u: Record<string, unknown>) => {
    setManageUser(u);
    setManageStatus(String(u.status ?? 'active'));
    setManageNewEmail('');
    setManageVerifyCode('');
  };

  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">👥 Usuarios</h1>
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'parent', 'coach', 'admin'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-full text-[10px] font-label-caps border ${
                roleFilter === r
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-outline-variant/30 text-on-surface-variant'
              }`}
            >
              {r === 'all' ? 'Todos' : userRoleLabel(r)}
            </button>
          ))}
          <span className="font-label-caps text-label-caps text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant/20">
            {rows.length} registrados
          </span>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2"
          >
            ➕ Crear usuario
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-low/50">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-container border-b border-outline-variant/20">
            <tr>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Usuario</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Rol</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Estado</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const role = String(u.role);
              const status = String(u.status);
              const locked = isUserLoginLocked(u);
              return (
                <tr key={String(u.id)} className="border-t border-outline-variant/10 hover:bg-surface-container/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center shrink-0 border border-outline-variant/20">
                        <MaterialIcon name={role === 'admin' ? 'admin_panel_settings' : role === 'coach' ? 'sports' : 'person'} className="text-on-surface-variant" size={18} />
                      </div>
                      <span className="text-on-surface">{String(u.email)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps ${
                      role === 'admin' ? 'bg-error/15 text-error' :
                      role === 'coach' ? 'bg-primary/15 text-primary' :
                      'bg-secondary/15 text-secondary'
                    }`}>
                      {userRoleLabel(role)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps ${
                        u.status === 'active' ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant'
                      }`}>
                        <MaterialIcon name={u.status === 'active' ? 'check_circle' : 'block'} size={12} />
                        {userStatusLabel(status)}
                      </span>
                      {Boolean(u.payment_hold) && role === 'parent' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps bg-error/15 text-error">
                          <MaterialIcon name="payments" size={12} />
                          Mora (cuotas)
                        </span>
                      ) : null}
                      {locked && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps bg-error/15 text-error">
                          <MaterialIcon name="lock" size={12} />
                          Login bloqueado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => openManage(u)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/40 text-primary text-[10px] font-label-caps hover:bg-primary/10 transition-colors"
                    >
                      <MaterialIcon name="manage_accounts" size={14} />
                      Gestionar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DashboardModal open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} title="Crear usuario">
        <form onSubmit={onCreate} className="space-y-3">
          <div>
            <label className={formLabelClass}>Correo electrónico</label>
            <input type="email" autoComplete="off" className={formInputClass} {...register('email', { required: 'Requerido' })} />
            {errors.email && <p className={formErrorClass}>{errors.email.message}</p>}
          </div>
          <div>
            <label className={formLabelClass}>Contraseña</label>
            <input type="password" autoComplete="new-password" className={formInputClass} {...register('password', { required: 'Requerido', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })} />
            {errors.password && <p className={formErrorClass}>{errors.password.message}</p>}
          </div>
          <div>
            <label className={formLabelClass}>Nombre completo</label>
            <input className={formInputClass} {...register('fullName', { required: 'Requerido', minLength: 2 })} />
            {errors.fullName && <p className={formErrorClass}>{errors.fullName.message}</p>}
          </div>
          <div>
            <label className={formLabelClass}>Rol</label>
            <select className={formInputClass} {...register('role', { required: true })}>
              <option value="admin">Administrador</option>
              <option value="coach">Entrenador</option>
            </select>
          </div>
          <div className={formActionsClass}>
            <button type="button" onClick={() => { setCreateOpen(false); reset(); }} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-caps text-label-caps">
              Cancelar
            </button>
            <button type="submit" disabled={createMut.isPending} className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps disabled:opacity-50">
              {createMut.isPending ? 'Creando…' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </DashboardModal>

      <DashboardModal
        open={Boolean(manageUser)}
        onClose={() => setManageUser(null)}
        title={manageUser ? `Gestionar: ${String(manageUser.email)}` : 'Usuario'}
      >
        {manageUser ? (
          <div className="space-y-6">
            <div>
              <label className={formLabelClass}>Estado de la cuenta</label>
              <select
                className={formInputClass}
                value={manageStatus}
                onChange={(e) => setManageStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{userStatusLabel(s)}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={statusMut.isPending || manageStatus === String(manageUser.status)}
                onClick={() => statusMut.mutate({ id: String(manageUser.id), status: manageStatus })}
                className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-caps text-sm shadow-sm hover:shadow-gold-glow disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                <MaterialIcon name="save" size={18} />
                {statusMut.isPending ? 'Guardando…' : 'Guardar estado'}
              </button>
              {String(manageUser.role) === 'parent' ? (
                <p className="mt-2 text-[11px] text-on-surface-variant">
                  Para <strong>suspender</strong> un padre, elige <strong>Suspendido</strong> y guarda. Si debe cuotas,
                  usa <strong>Cuotas</strong>: bloqueo automático solo si faltan <strong>registro y mensualidad</strong>;
                  si falta solo uno, verá advertencia al entrar.
                </p>
              ) : null}
              {Boolean(manageUser.payment_hold) && String(manageUser.role) === 'parent' ? (
                <p className="mt-2 text-[11px] text-error">
                  Bloqueado por mora. Marca pagos en Cuotas o contacto con Gabo.
                </p>
              ) : null}
            </div>

            {isUserLoginLocked(manageUser) ? (
              <div className="p-3 rounded-lg bg-error/10 border border-error/30">
                <p className="text-sm text-on-surface-variant mb-2">Cuenta bloqueada por intentos fallidos de login.</p>
                <button
                  type="button"
                  disabled={unlockMut.isPending}
                  onClick={() => {
                    if (!window.confirm('¿Desbloquear acceso de login?')) return;
                    unlockMut.mutate(String(manageUser.id));
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-error/40 text-error text-[10px] font-label-caps"
                >
                  <MaterialIcon name="lock_open" size={14} />
                  Desbloquear login
                </button>
              </div>
            ) : null}

            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-on-surface-variant space-y-2">
              <p>
                <strong className="text-primary">Seguridad:</strong> acciones sensibles requieren un código de 6 dígitos
                enviado a <strong className="text-on-surface">{sessionUser?.email}</strong>. Activa 2FA en Mi perfil.
              </p>
              <label className={formLabelClass}>Código de verificación (6 dígitos)</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className={formInputClass}
                placeholder="000000"
                value={manageVerifyCode}
                onChange={(e) => setManageVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>

            <div>
              <label className={formLabelClass}>Cambiar correo de acceso</label>
              <p className="text-xs text-on-surface-variant mb-2">
                Solicita código, ingrésalo arriba y luego el nuevo correo. El usuario debe confirmar el enlace.
              </p>
              <input
                type="email"
                className={formInputClass}
                placeholder="nuevo@correo.com"
                value={manageNewEmail}
                onChange={(e) => setManageNewEmail(e.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={sendEmailCodeMut.isPending}
                  onClick={() => sendEmailCodeMut.mutate(String(manageUser.id))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/40 text-on-surface-variant text-[10px] font-label-caps disabled:opacity-50"
                >
                  Enviar código
                </button>
                <button
                  type="button"
                  disabled={emailChangeMut.isPending || !manageNewEmail.trim() || manageVerifyCode.length !== 6}
                  onClick={() =>
                    emailChangeMut.mutate({
                      id:               String(manageUser.id),
                      newEmail:         manageNewEmail.trim(),
                      verificationCode: manageVerifyCode,
                    })
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/40 text-primary text-[10px] font-label-caps disabled:opacity-50"
                >
                  <MaterialIcon name="forward_to_inbox" size={14} />
                  Confirmar cambio de correo
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/25">
              <p className="text-xs text-on-surface-variant mb-3">
                Eliminar cuenta: no podrá iniciar sesión. Si es padre, sus vínculos con jugadores se revocan automáticamente.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={sendDeleteCodeMut.isPending || String(manageUser.id) === sessionUser?.id}
                  onClick={() => sendDeleteCodeMut.mutate(String(manageUser.id))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/40 text-[10px] font-label-caps disabled:opacity-50"
                >
                  Enviar código para eliminar
                </button>
                <button
                  type="button"
                  disabled={
                    deleteMut.isPending ||
                    String(manageUser.id) === sessionUser?.id ||
                    import.meta.env.PROD && manageVerifyCode.length !== 6
                  }
                  onClick={() => {
                    const email = String(manageUser.email);
                    const role = userRoleLabel(String(manageUser.role));
                    if (
                      !window.confirm(
                        `¿Eliminar la cuenta ${email} (${role})?\n\nNo podrá volver a entrar. Vínculos padre-jugador revocados si aplica.`,
                      )
                    ) {
                      return;
                    }
                    deleteMut.mutate({
                      id: String(manageUser.id),
                      code: manageVerifyCode || '000000',
                    });
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-error/40 text-error text-[10px] font-label-caps hover:bg-error/10 disabled:opacity-50"
                >
                  <MaterialIcon name="delete" size={14} />
                  {String(manageUser.id) === sessionUser?.id
                    ? 'No puedes eliminar tu propia cuenta'
                    : deleteMut.isPending
                      ? 'Eliminando…'
                      : 'Eliminar con código'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </DashboardModal>
    </div>
  );
}
