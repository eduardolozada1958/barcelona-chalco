import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { getSettingsAdmin, updateSettings } from '@/api/settings';
import {
  DashboardPageHeader,
  DashboardPageShell,
  DashboardPrimaryButton,
  DashboardSectionTitle,
} from '@/components/dashboard/DashboardUi';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

const inputClass = 'dashboard-input w-full';
const labelClass = 'dashboard-field-label';

export function DashboardSettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['settings-admin'], queryFn: getSettingsAdmin });
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    const d = q.data?.data as Record<string, unknown> | undefined;
    if (!d) return;
    setForm({
      clubName:         String(d.club_name ?? ''),
      season:           String(d.season ?? ''),
      contactEmail:     String(d.contact_email ?? ''),
      contactPhone:     String(d.contact_phone ?? ''),
      primaryColor:     String(d.primary_color ?? '#D4AF37'),
      clubDescription:  String(d.club_description ?? ''),
    });
  }, [q.data]);

  const save = useMutation({
    mutationFn: () =>
      updateSettings({
        clubName:        form.clubName || undefined,
        season:          form.season || undefined,
        contactEmail:    form.contactEmail || null,
        contactPhone:    form.contactPhone || null,
        primaryColor:    form.primaryColor || undefined,
        clubDescription: form.clubDescription || null,
      }),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Guardado');
      void qc.invalidateQueries({ queryKey: ['settings-admin'] });
      void qc.invalidateQueries({ queryKey: ['settings-public'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <Spinner />;

  return (
    <DashboardPageShell className="max-w-2xl">
      <DashboardPageHeader
        title="Configuración"
        description="Personaliza la identidad y datos de contacto del club."
      />

      <div className="bg-[#002366]/20 backdrop-blur-md border border-primary/20 rounded-xl p-stack-lg space-y-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 mb-stack-md border-b border-outline-variant/20 pb-3">
          <MaterialIcon name="settings" className="text-primary" />
          <DashboardSectionTitle>Datos del Club</DashboardSectionTitle>
        </div>

        <div className="relative z-10 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>NOMBRE DEL CLUB</label>
            <input className={inputClass} value={form.clubName ?? ''} onChange={(e) => setForm((f) => ({ ...f, clubName: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>TEMPORADA</label>
            <input className={inputClass} value={form.season ?? ''} onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>COLOR PRIMARIO</label>
            <div className="flex gap-3 items-center">
              <input className={inputClass} value={form.primaryColor ?? ''} onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))} />
              <div className="w-10 h-10 rounded-lg shrink-0 border border-outline-variant/30" style={{ backgroundColor: form.primaryColor || '#D4AF37' }} />
            </div>
          </div>
          <div>
            <label className={labelClass}>EMAIL DE CONTACTO</label>
            <input
              type="email"
              className={inputClass}
              value={form.contactEmail ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
            />
            <p className="mt-2 text-xs text-on-surface-variant leading-relaxed">
              Correo público del club (sitio web, avisos). No es el usuario para iniciar sesión; eso se cambia en{' '}
              <strong className="text-on-surface">Mi perfil</strong> o en <strong className="text-on-surface">Usuarios</strong>.
            </p>
          </div>
          <div>
            <label className={labelClass}>TELÉFONO</label>
            <input className={inputClass} value={form.contactPhone ?? ''} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>DESCRIPCIÓN</label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              value={form.clubDescription ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, clubDescription: e.target.value }))}
            />
          </div>
        </div>

        <DashboardPrimaryButton
          className="relative z-10 px-8"
          onClick={() => save.mutate()}
          disabled={save.isPending}
        >
          {save.isPending ? (
            <MaterialIcon name="progress_activity" className="animate-spin" size={16} />
          ) : (
            <MaterialIcon name="save" size={16} />
          )}
          Guardar cambios
        </DashboardPrimaryButton>
      </div>
    </DashboardPageShell>
  );
}
