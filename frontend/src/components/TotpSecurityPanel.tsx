import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import * as totpApi from '@/api/totp';
import { MaterialIcon } from '@/components/MaterialIcon';

export function TotpSecurityPanel() {
  const qc = useQueryClient();
  const [step, setStep] = useState<'idle' | 'setup' | 'backup'>('idle');
  const [setupData, setSetupData] = useState<totpApi.TotpSetupResult | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const statusQ = useQuery({
    queryKey: ['totp-status'],
    queryFn: async () => {
      const res = await totpApi.getTotpStatus();
      if (!res.success || !res.data) throw new Error(res.message ?? 'Error');
      return res.data;
    },
  });

  const setupMut = useMutation({
    mutationFn: async () => {
      const res = await totpApi.beginTotpSetup();
      if (!res.success || !res.data) throw new Error(res.message ?? 'Error al iniciar 2FA');
      return res.data;
    },
    onSuccess: (data) => {
      setSetupData(data);
      setStep('setup');
      setConfirmCode('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirmMut = useMutation({
    mutationFn: async () => {
      const res = await totpApi.confirmTotpSetup(confirmCode);
      if (!res.success || !res.data) throw new Error(res.message ?? 'Código incorrecto');
      return res.data;
    },
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setStep('backup');
      void qc.invalidateQueries({ queryKey: ['totp-status'] });
      toast.success('Verificación en dos pasos activada');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disableMut = useMutation({
    mutationFn: async () => {
      const res = await totpApi.disableTotp(disablePassword, disableCode);
      if (!res.success) throw new Error(res.message ?? 'No se pudo desactivar');
    },
    onSuccess: () => {
      setStep('idle');
      setSetupData(null);
      setDisablePassword('');
      setDisableCode('');
      void qc.invalidateQueries({ queryKey: ['totp-status'] });
      toast.success('2FA desactivado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const enabled = statusQ.data?.enabled ?? false;

  if (step === 'backup') {
    return (
      <section className="rounded-xl border border-primary/30 bg-surface-container-low p-stack-md space-y-4">
        <h3 className="font-headline-lg text-headline-lg-mobile text-primary flex items-center gap-2">
          <MaterialIcon name="verified_user" /> Guarda tus códigos de respaldo
        </h3>
        <p className="text-sm text-on-surface-variant">
          Si pierdes el teléfono, usa uno de estos códigos (cada uno solo una vez). Guárdalos en un lugar seguro.
        </p>
        <ul className="grid grid-cols-2 gap-2 font-mono text-sm bg-surface-container-lowest rounded-lg p-4">
          {backupCodes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            setStep('idle');
            setBackupCodes([]);
          }}
          className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-caps text-label-caps"
        >
          Entendido
        </button>
      </section>
    );
  }

  if (step === 'setup' && setupData) {
    return (
      <section className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-stack-md space-y-4">
        <h3 className="font-headline-lg text-headline-lg-mobile text-on-surface">Configurar Google Authenticator</h3>
        <ol className="text-sm text-on-surface-variant space-y-2 list-decimal list-inside">
          <li>Instala Google Authenticator (o Authy) en tu teléfono.</li>
          <li>Escanea este código QR o ingresa la clave manual.</li>
          <li>Escribe el código de 6 dígitos para confirmar.</li>
        </ol>
        <div className="flex justify-center">
          <img src={setupData.qrDataUrl} alt="QR 2FA" className="rounded-lg bg-white p-2" width={220} height={220} />
        </div>
        <p className="text-xs text-center font-mono break-all text-on-surface-variant">
          Clave manual: <span className="text-primary">{setupData.manualSecret}</span>
        </p>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={6}
          value={confirmCode}
          onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 text-center text-xl tracking-widest"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setStep('idle');
              setSetupData(null);
            }}
            className="flex-1 py-3 rounded-lg border border-outline-variant/40 text-on-surface-variant font-label-caps text-label-caps"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={confirmCode.length !== 6 || confirmMut.isPending}
            onClick={() => confirmMut.mutate()}
            className="flex-1 py-3 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps disabled:opacity-50"
          >
            Activar 2FA
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-stack-md space-y-4">
      <div className="flex items-start gap-3">
        <MaterialIcon name="phonelink_lock" className="text-primary shrink-0" size={28} />
        <div>
          <h3 className="font-headline-lg text-headline-lg-mobile text-on-surface">
            Verificación en dos pasos (opcional)
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Protege tu cuenta con Google Authenticator. Si alguien obtiene tu contraseña, no podrá entrar sin tu teléfono.
          </p>
        </div>
      </div>

      {statusQ.isLoading ? (
        <p className="text-sm text-on-surface-variant">Cargando…</p>
      ) : enabled ? (
        <div className="space-y-4">
          <p className="text-sm text-green-400 flex items-center gap-2">
            <MaterialIcon name="check_circle" size={18} /> 2FA activo
            {statusQ.data?.enabledAt ? (
              <span className="text-on-surface-variant">
                desde {new Date(statusQ.data.enabledAt).toLocaleDateString('es-MX')}
              </span>
            ) : null}
          </p>
          <div className="space-y-3 border-t border-outline-variant/20 pt-4">
            <p className="text-sm text-on-surface-variant">Para desactivar, confirma tu contraseña y un código actual.</p>
            <input
              type="password"
              placeholder="Contraseña"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-2 text-sm"
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Código 6 dígitos o respaldo"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-2 text-sm"
            />
            <button
              type="button"
              disabled={disableMut.isPending || !disablePassword || disableCode.length < 6}
              onClick={() => disableMut.mutate()}
              className="text-error text-sm font-label-caps hover:underline"
            >
              Desactivar 2FA
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={setupMut.isPending}
          onClick={() => setupMut.mutate()}
          className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-caps text-label-caps"
        >
          Activar con Google Authenticator
        </button>
      )}
    </section>
  );
}
