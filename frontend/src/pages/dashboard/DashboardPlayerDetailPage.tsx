import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { generatePlayerQr, getPlayerAdmin, updatePlayer, verifyPlayer } from '@/api/players';
import { playerQrImageUrl } from '@/api/qr';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

function maskCurpPreview(curp: string): string {
  const u = curp.toUpperCase().replace(/[^A-Z0-9Ñ]/g, '');
  if (u.length === 0) return '—';
  if (u.length <= 10) return `${u}…`;
  return `${u.slice(0, 10)}…`;
}

export function DashboardPlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [curpDraft, setCurpDraft] = useState('');

  const q = useQuery({
    queryKey: ['player-admin', id],
    queryFn:  () => getPlayerAdmin(id!),
    enabled:  Boolean(id),
  });

  useEffect(() => {
    const row = q.data?.data as Record<string, unknown> | undefined;
    if (!row) return;
    setCurpDraft(typeof row.curp === 'string' ? row.curp : '');
  }, [q.data]);

  const verifyM = useMutation({
    mutationFn: () => verifyPlayer(id!),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Verificado');
      void qc.invalidateQueries({ queryKey: ['player-admin', id] });
      void qc.invalidateQueries({ queryKey: ['players-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const qrM = useMutation({
    mutationFn: () => generatePlayerQr(id!),
    onSuccess: (res) => {
      toast.success(res.message ?? 'QR generado');
      void qc.invalidateQueries({ queryKey: ['player-admin', id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveCurpM = useMutation({
    mutationFn: () => {
      const t = curpDraft.trim().toUpperCase().replace(/[^A-Z0-9Ñ]/g, '');
      if (t.length > 0 && t.length !== 18) {
        return Promise.reject(new Error('La CURP debe tener exactamente 18 caracteres alfanuméricos, o déjala vacía.'));
      }
      return updatePlayer(id!, { curp: t.length === 0 ? null : t });
    },
    onSuccess: (res) => {
      toast.success(res.message ?? 'CURP guardada');
      void qc.invalidateQueries({ queryKey: ['player-admin', id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!id || q.isLoading) return <Spinner />;
  const p = q.data?.data as Record<string, unknown> | undefined;
  if (!p) return <p className="text-on-surface">No encontrado.</p>;

  const imgUrl = playerQrImageUrl(String(p.id));

  return (
    <div className="max-w-3xl">
      <Link to="/dashboard/players" className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-label-caps text-label-caps mb-stack-md">
        <MaterialIcon name="arrow_back" size={16} /> Plantilla
      </Link>

      {/* Header Card */}
      <div className="bg-[#002366]/20 backdrop-blur-md border border-primary/20 rounded-xl p-stack-lg relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start gap-6 relative z-10">
          <div className="w-20 h-20 rounded-full bg-surface-variant flex items-center justify-center shrink-0 border border-outline-variant/30">
            <MaterialIcon name="person" className="text-primary" size={36} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              {String(p.first_name)} {String(p.last_name)}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="font-label-caps text-label-caps text-primary">{String(p.category)}</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps ${
                p.status === 'active' ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant'
              }`}>
                <MaterialIcon name={p.status === 'active' ? 'check_circle' : 'pause_circle'} size={12} />
                {String(p.status)}
              </span>
              {Boolean(p.is_verified) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps bg-primary/15 text-primary">
                  <MaterialIcon name="verified" size={12} filled /> Verificado
                </span>
              )}
              {Boolean(p.qr_token) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps bg-secondary/15 text-secondary">
                  <MaterialIcon name="qr_code" size={12} /> QR activo
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-stack-md flex flex-wrap gap-3">
        <button
          type="button"
          disabled={verifyM.isPending || Boolean(p.is_verified)}
          onClick={() => verifyM.mutate()}
          className="bg-primary/15 text-primary border border-primary/30 font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:bg-primary hover:text-on-primary disabled:opacity-40 transition-all flex items-center gap-2"
        >
          <MaterialIcon name="verified" size={16} /> {p.is_verified ? 'Ya verificado' : 'Verificar'}
        </button>
        <button
          type="button"
          disabled={qrM.isPending}
          onClick={() => qrM.mutate()}
          className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all flex items-center gap-2"
        >
          <MaterialIcon name="qr_code_2" size={16} /> {p.qr_token ? 'Renovar QR' : 'Generar QR'}
        </button>
      </div>

      {/* CURP (admin) */}
      <div className="mt-stack-lg bg-surface-container/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl p-stack-md">
        <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-stack-sm flex items-center gap-2">
          <MaterialIcon name="badge" size={18} className="text-primary" /> CURP
        </h3>
        <p className="text-xs text-on-surface-variant mb-3">
          Registro oficial de 18 caracteres. Al escanear el QR, el entrenador verá solo un fragmento (ej. LOQE980130…) y la fecha de nacimiento, nunca la CURP completa.
        </p>
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          maxLength={18}
          value={curpDraft}
          onChange={(e) => setCurpDraft(e.target.value.toUpperCase())}
          placeholder="18 caracteres alfanuméricos"
          className="w-full max-w-md rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-on-surface text-sm font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <p className="text-xs text-on-surface-variant mt-2">
          Vista entrenador (enmascarada): <span className="text-primary font-mono">{maskCurpPreview(curpDraft)}</span>
        </p>
        <button
          type="button"
          disabled={saveCurpM.isPending}
          onClick={() => saveCurpM.mutate()}
          className="mt-3 bg-surface-variant text-on-surface font-label-caps text-label-caps px-4 py-2 rounded-lg border border-outline-variant/40 hover:border-primary/40 disabled:opacity-50"
        >
          {saveCurpM.isPending ? 'Guardando…' : 'Guardar CURP'}
        </button>
      </div>

      {/* QR Preview */}
      {p.qr_token ? (
        <div className="mt-stack-lg bg-surface-container/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl p-stack-md">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-stack-sm flex items-center gap-2">
            <MaterialIcon name="qr_code_2" size={18} className="text-primary" /> Credencial Digital
          </h3>
          <p className="text-xs text-on-surface-variant mb-4">
            Este código enlaza a la validación del jugador en <strong className="text-on-surface">/credencial/…</strong> (ficha para cuerpo técnico). Si al escanear abre otro sitio, configura en Render la variable <code className="text-primary">APP_PUBLIC_URL</code> con la URL exacta de tu frontend (Cloudflare Pages).
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <img
              key={String(p.qr_token)}
              src={imgUrl}
              alt="QR jugador"
              className="h-48 w-48 rounded-lg border border-outline-variant/20 bg-white p-2"
            />
            <div className="space-y-3 text-sm text-on-surface-variant">
              <p><span className="font-label-caps text-[10px]">TOKEN:</span> <code className="text-primary break-all">{String(p.qr_token)}</code></p>
              <Link to={`/credencial/${encodeURIComponent(String(p.qr_token))}`} className="inline-flex items-center gap-1 text-primary hover:underline font-label-caps text-label-caps">
                <MaterialIcon name="open_in_new" size={14} /> Abrir ficha de validación (como entrenador)
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
