import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { createUser, listUsers, type CreateUserBody } from '@/api/users';
import { DashboardModal, formActionsClass, formErrorClass, formInputClass, formLabelClass } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';
import { userRoleLabel, userStatusLabel } from '@/config/labels';

type CreateUserForm = {
  email: string;
  password: string;
  fullName: string;
  role: CreateUserBody['role'];
};

export function DashboardUsersPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const q = useQuery({
    queryKey: ['users-admin'],
    queryFn: () => listUsers({ page: 1, limit: 50 }),
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

  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">👥 Usuarios</h1>
        <div className="flex items-center gap-2">
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
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const role = String(u.role);
              const status = String(u.status);
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
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps ${
                      u.status === 'active' ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant'
                    }`}>
                      <MaterialIcon name={u.status === 'active' ? 'check_circle' : 'block'} size={12} />
                      {userStatusLabel(status)}
                    </span>
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
    </div>
  );
}
