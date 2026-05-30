import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  createUser,
  deleteUser,
  getUnlinkedParentsStats,
  isUserLoginLocked,
  listUsers,
  remindSingleParentCurp,
  remindUnlinkedParents,
  requestUserEmailChange,
  sendUserDeleteCode,
  sendUserEmailChangeCode,
  unlockUserLogin,
  updateUser,
  type CreateUserBody,
} from '@/api/users';
import { useAuth } from '@/contexts/AuthContext';
import {
  DashboardPageHeader,
  DashboardPageShell,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
  DashboardTableFrame,
} from '@/components/dashboard/DashboardUi';
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
type ParentLinkFilter = 'all' | 'no_link' | 'pending' | 'linked';

function parentLinkBadge(summary: unknown): { text: string; className: string } {
  const s = summary as { approved?: number; pending?: number; hasNoLinks?: boolean } | null | undefined;
  if (!s) return { text: '—', className: 'bg-surface-variant text-on-surface-variant' };
  const approved = Number(s.approved ?? 0);
  const pending = Number(s.pending ?? 0);
  if (approved > 0) {
    return {
      text: approved === 1 ? '1 hijo vinculado' : `${approved} hijos vinculados`,
      className: 'bg-green-500/15 text-green-400',
    };
  }
  if (pending > 0) return { text: 'CURP por aprobar', className: 'bg-amber-500/15 text-amber-400' };
  if (s.hasNoLinks) return { text: 'Sin vínculo CURP', className: 'bg-error/15 text-error' };
  return { text: 'Sin vínculos activos', className: 'bg-surface-variant text-on-surface-variant' };
}

function matchesParentLinkFilter(summary: unknown, filter: ParentLinkFilter): boolean {
  if (filter === 'all') return true;
  const s = summary as { approved?: number; pending?: number; hasNoLinks?: boolean } | undefined;
  const approved = Number(s?.approved ?? 0);
  const pending = Number(s?.pending ?? 0);
  const hasNoLinks = Boolean(s?.hasNoLinks);
  if (filter === 'linked') return approved > 0;
  if (filter === 'pending') return pending > 0 && approved === 0;
  if (filter === 'no_link') return hasNoLinks || (approved === 0 && pending === 0);
  return true;
}

export function DashboardUsersPage() {
  const { user: sessionUser } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [parentLinkFilter, setParentLinkFilter] = useState<ParentLinkFilter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [manageUser, setManageUser] = useState<Record<string, unknown> | null>(null);
  const [manageStatus, setManageStatus] = useState<string>('active');
  const [manageNewEmail, setManageNewEmail] = useState('');
  const [manageVerifyCode, setManageVerifyCode] = useState('');
  const [remindOpen, setRemindOpen] = useState(false);
  const [remindEmail, setRemindEmail] = useState(true);
  const [remindWhatsApp, setRemindWhatsApp] = useState(false);

  const unlinkedStatsQ = useQuery({
    queryKey: ['unlinked-parents-stats'],
    queryFn: getUnlinkedParentsStats,
    enabled: roleFilter === 'parent',
  });

  const q = useQuery({
    queryKey: ['users-admin', roleFilter],
    queryFn: () =>
      listUsers({
        page:  1,
        limit: 80,
        ...(roleFilter !== 'all' ? { role: roleFilter } : {}),
      }),
  });

  const allRows = (q.data?.data ?? []) as Record<string, unknown>[];
  const rows = allRows.filter((u) => {
    if (String(u.role) !== 'parent') return true;
    return matchesParentLinkFilter(u.parentLinkSummary, parentLinkFilter);
  });
  const showParentLinkCol = roleFilter === 'parent' || roleFilter === 'all';

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

  const remindMut = useMutation({
    mutationFn: () => remindUnlinkedParents({ sendEmail: remindEmail, sendWhatsApp: remindWhatsApp }),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Recordatorios enviados');
      setRemindOpen(false);
      void unlinkedStatsQ.refetch();
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e)),
  });

  const singleRemindMut = useMutation({
    mutationFn: ({ id, sendEmail, sendWhatsApp }: { id: string; sendEmail: boolean; sendWhatsApp: boolean }) =>
      remindSingleParentCurp(id, { sendEmail, sendWhatsApp }),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Recordatorio enviado');
      void unlinkedStatsQ.refetch();
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

  const deepLinkUserId = searchParams.get('userId');

  useEffect(() => {
    if (q.isLoading || !deepLinkUserId || allRows.length === 0) return;
    const u = allRows.find((r) => String(r.id) === deepLinkUserId);
    if (u) {
      if (String(u.role) === 'parent') setRoleFilter('parent');
      openManage(u);
      setSearchParams({}, { replace: true });
    }
  }, [deepLinkUserId, q.isLoading, allRows, setSearchParams]);

  if (q.isLoading) return <Spinner />;

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="👥 Usuarios"
        actions={
          <>
            {(['all', 'parent', 'coach', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRoleFilter(r);
                  if (r !== 'parent') setParentLinkFilter('all');
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-label-caps border ${
                  roleFilter === r
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-outline-variant/30 text-on-surface-variant'
                }`}
              >
                {r === 'all' ? 'Todos' : userRoleLabel(r)}
              </button>
            ))}
            {roleFilter === 'parent' ? (
              <>
                {(
                  [
                    { v: 'all', label: 'Todos los padres' },
                    { v: 'no_link', label: 'Sin CURP' },
                    { v: 'pending', label: 'CURP pendiente' },
                    { v: 'linked', label: 'Con hijo vinculado' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.v}
                    type="button"
                    onClick={() => setParentLinkFilter(f.v)}
                    className={`px-3 py-1 rounded-full text-[10px] font-label-caps border ${
                      parentLinkFilter === f.v
                        ? 'border-secondary bg-secondary/15 text-secondary'
                        : 'border-outline-variant/30 text-on-surface-variant'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </>
            ) : null}
            <span className="font-label-caps text-label-caps text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant/20">
              {rows.length} registrados
            </span>
            {(roleFilter === 'parent' || roleFilter === 'all') ? (
              <DashboardSecondaryButton
                className="bg-secondary/15 text-secondary border-secondary/30 hover:bg-secondary/25 text-[11px]"
                onClick={() => setRemindOpen(true)}
              >
                <MaterialIcon name="mail" size={16} />
                Recordar vínculo CURP
                {unlinkedStatsQ.data?.data?.count != null ? ` (${unlinkedStatsQ.data.data.count})` : ''}
              </DashboardSecondaryButton>
            ) : null}
            <DashboardPrimaryButton onClick={() => setCreateOpen(true)}>
              ➕ Crear usuario
            </DashboardPrimaryButton>
          </>
        }
      />

      <DashboardTableFrame>
        <table className="min-w-full text-left text-sm w-full">
          <thead className="bg-surface-container border-b border-outline-variant/20">
            <tr>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Usuario</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Rol</th>
              {showParentLinkCol ? (
                <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Vínculo CURP</th>
              ) : null}
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Estado</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const role = String(u.role);
              const status = String(u.status);
              const locked = isUserLoginLocked(u);
              const linkBadge = role === 'parent' ? parentLinkBadge(u.parentLinkSummary) : null;
              const emailOk = u.email_verified !== false;
              return (
                <tr key={String(u.id)} className="border-t border-outline-variant/10 hover:bg-surface-container/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center shrink-0 border border-outline-variant/20">
                        <MaterialIcon name={role === 'admin' ? 'admin_panel_settings' : role === 'coach' ? 'sports' : 'person'} className="text-on-surface-variant" size={18} />
                      </div>
                      <span className="text-on-surface">{String(u.email)}</span>
                      {role === 'parent' && !emailOk ? (
                        <span className="block text-[10px] text-amber-400 mt-0.5">Correo sin verificar</span>
                      ) : null}
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
                  {showParentLinkCol ? (
                    <td className="p-4">
                      {role === 'parent' && linkBadge ? (
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-label-caps ${linkBadge.className}`}>
                          {linkBadge.text}
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant">—</span>
                      )}
                    </td>
                  ) : null}
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
      </DashboardTableFrame>

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
            <p className="text-xs text-on-surface-variant rounded-lg border border-outline-variant/25 bg-surface-container/40 px-3 py-2.5 leading-relaxed">
              Estás gestionando la cuenta de{' '}
              <strong className="text-on-surface">{String(manageUser.email)}</strong>.
              Suspender o activar no pide código. Solo <strong>eliminar</strong> o{' '}
              <strong>cambiar su correo de acceso</strong> piden que <strong>tú (admin)</strong> confirmes con un
              código enviado a <strong className="text-primary">{sessionUser?.email}</strong> — no al correo del
              usuario de arriba.
            </p>

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

            {String(manageUser.role) === 'parent' &&
            (manageUser.parentLinkSummary as { hasNoLinks?: boolean } | undefined)?.hasNoLinks ? (
              <div className="rounded-lg border border-secondary/30 bg-secondary/5 px-3 py-3 space-y-3">
                <p className="font-label-caps text-[10px] text-secondary tracking-wide">Recordatorio vínculo CURP</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Este padre aún no ha vinculado a su hijo con CURP. Puedes enviar{' '}
                  <strong className="text-on-surface">WhatsApp aunque el correo no esté verificado</strong>, si registró
                  teléfono. El correo solo se envía si la cuenta está activa y verificada.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={singleRemindMut.isPending}
                    onClick={() => {
                      if (!window.confirm(`¿Enviar WhatsApp a ${String(manageUser.email)}?`)) return;
                      singleRemindMut.mutate({
                        id: String(manageUser.id),
                        sendEmail: false,
                        sendWhatsApp: true,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-green-500/40 text-green-400 text-[10px] font-label-caps hover:bg-green-500/10 disabled:opacity-50"
                  >
                    <MaterialIcon name="chat" size={16} />
                    WhatsApp (1 mensaje)
                  </button>
                  <button
                    type="button"
                    disabled={singleRemindMut.isPending || manageUser.email_verified === false}
                    onClick={() => {
                      if (!window.confirm(`¿Enviar correo a ${String(manageUser.email)}?`)) return;
                      singleRemindMut.mutate({
                        id: String(manageUser.id),
                        sendEmail: true,
                        sendWhatsApp: false,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 text-primary text-[10px] font-label-caps hover:bg-primary/10 disabled:opacity-50"
                    title={
                      manageUser.email_verified === false
                        ? 'Correo no verificado: usa WhatsApp o espera a que active la cuenta'
                        : undefined
                    }
                  >
                    <MaterialIcon name="mail" size={16} />
                    Correo
                  </button>
                </div>
              </div>
            ) : null}

            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 text-xs text-on-surface-variant space-y-2">
              <p className="font-label-caps text-[10px] text-primary tracking-wide">
                Tu confirmación como administrador
              </p>
              <p>
                El código de 6 dígitos llega a <strong className="text-on-surface">{sessionUser?.email}</strong>{' '}
                (tu sesión), para autorizar borrar o cambiar el correo de{' '}
                <strong className="text-on-surface">{String(manageUser.email)}</strong>. No uses la contraseña ni el
                correo del padre/tutor.
              </p>
              <label className={formLabelClass}>Código enviado a tu correo (6 dígitos)</label>
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
              <label className={formLabelClass}>Cambiar correo de acceso de este usuario</label>
              <p className="text-xs text-on-surface-variant mb-2">
                1) <strong>Enviar código</strong> → llega a tu correo de admin. 2) Ingrésalo arriba. 3) Escribe el
                nuevo correo y confirma. Después, <strong>{String(manageUser.email)}</strong> (o el nuevo correo)
                recibirá un enlace para aceptar el cambio.
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
                <strong>Eliminar</strong> la cuenta de <strong>{String(manageUser.email)}</strong>: no podrá iniciar
                sesión. Si es padre, sus vínculos con jugadores se revocan. Pide el código a tu correo de admin (arriba),
                no al del usuario.
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

      <DashboardModal open={remindOpen} onClose={() => setRemindOpen(false)} title="Recordar vínculo CURP">
        <p className="text-sm text-on-surface-variant mb-4">
          Envía un recordatorio a padres <strong>sin vínculo CURP</strong> (incluye cuentas pendientes de verificar
          correo para WhatsApp). Un solo mensaje por padre.
        </p>
        {unlinkedStatsQ.data?.data ? (
          <ul className="text-sm text-on-surface-variant mb-4 space-y-1">
            <li>• {unlinkedStatsQ.data.data.count} padre(s) sin vínculo</li>
            <li>• {unlinkedStatsQ.data.data.withEmail} pueden recibir correo (activos + verificados)</li>
            <li>• {unlinkedStatsQ.data.data.withPhone} pueden recibir WhatsApp (con teléfono)</li>
            {unlinkedStatsQ.data.data.pendingEmail != null && unlinkedStatsQ.data.data.pendingEmail > 0 ? (
              <li>• {unlinkedStatsQ.data.data.pendingEmail} con correo aún sin verificar (solo WA)</li>
            ) : null}
          </ul>
        ) : null}
        <label className="flex items-center gap-2 mb-2 cursor-pointer">
          <input type="checkbox" checked={remindEmail} onChange={(e) => setRemindEmail(e.target.checked)} />
          <span className="text-sm">Enviar correo electrónico</span>
        </label>
        <label className="flex items-center gap-2 mb-6 cursor-pointer">
          <input type="checkbox" checked={remindWhatsApp} onChange={(e) => setRemindWhatsApp(e.target.checked)} />
          <span className="text-sm">Enviar WhatsApp (requiere teléfono registrado)</span>
        </label>
        <div className={formActionsClass}>
          <button type="button" onClick={() => setRemindOpen(false)} className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant">
            Cancelar
          </button>
          <button
            type="button"
            disabled={remindMut.isPending || (!remindEmail && !remindWhatsApp)}
            onClick={() => {
              if (!window.confirm('¿Enviar recordatorios a todos los padres sin vínculo CURP?')) return;
              remindMut.mutate();
            }}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary disabled:opacity-50"
          >
            {remindMut.isPending ? 'Enviando…' : 'Enviar recordatorios'}
          </button>
        </div>
      </DashboardModal>
    </DashboardPageShell>
  );
}
