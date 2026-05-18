import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { MaterialIcon } from '@/components/MaterialIcon';

const inputClass =
  'w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-3 pr-12 text-on-surface font-body-md outline-none transition-colors placeholder:text-on-surface-variant/40';

type PasswordInputProps = {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  autoComplete?: 'new-password' | 'current-password';
  hint?: string;
};

export function PasswordInput({
  id,
  label,
  registration,
  error,
  autoComplete = 'new-password',
  hint,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className={inputClass}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          tabIndex={-1}
        >
          <MaterialIcon name={visible ? 'visibility_off' : 'visibility'} size={22} />
        </button>
      </div>
      {hint ? <p className="mt-1.5 text-xs text-on-surface-variant">{hint}</p> : null}
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}
