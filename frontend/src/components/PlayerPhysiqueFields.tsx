import type { FieldValues, Path, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { formInputClass, formLabelClass } from '@/components/DashboardModal';
import {
  HEIGHT_BANDS,
  WEIGHT_BANDS,
  type PhysiqueFieldMode,
  type PhysiqueFormFields,
} from '@/utils/player-physique';

type Props<T extends FieldValues & PhysiqueFormFields> = {
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
};

const modeOptions: { value: PhysiqueFieldMode; label: string }[] = [
  { value: 'skip', label: 'Sin registrar' },
  { value: 'approx', label: 'Aproximado (no sé el número exacto)' },
  { value: 'exact', label: 'Medida exacta' },
];

export function PlayerPhysiqueFields<T extends FieldValues & PhysiqueFormFields>({
  register,
  watch,
  setValue,
}: Props<T>) {
  const heightMode = watch('heightMode' as Path<T>) as PhysiqueFieldMode;
  const weightMode = watch('weightMode' as Path<T>) as PhysiqueFieldMode;

  const onHeightMode = (mode: PhysiqueFieldMode) => {
    setValue('heightMode' as Path<T>, mode as T[Path<T>]);
    if (mode !== 'exact') setValue('heightCm' as Path<T>, '' as T[Path<T>]);
    if (mode !== 'approx') setValue('heightBand' as Path<T>, '' as T[Path<T>]);
  };

  const onWeightMode = (mode: PhysiqueFieldMode) => {
    setValue('weightMode' as Path<T>, mode as T[Path<T>]);
    if (mode !== 'exact') setValue('weightKg' as Path<T>, '' as T[Path<T>]);
    if (mode !== 'approx') setValue('weightBand' as Path<T>, '' as T[Path<T>]);
  };

  return (
    <div className="rounded-lg border border-outline-variant/30 bg-surface-container/30 p-3 space-y-4">
      <div>
        <span className="font-label-caps text-label-caps text-primary block">Estatura y peso</span>
        <p className="text-[11px] text-on-surface-variant mt-1">
          Opcional. Si no conoces la medida exacta, elige «Aproximado» y
          selecciona el rango que mejor encaje; se guarda un valor de referencia para el perfil.
        </p>
      </div>

      <div className="space-y-2">
        <label className={formLabelClass}>Estatura</label>
        <div className="flex flex-wrap gap-2">
          {modeOptions.map((opt) => (
            <button
              key={`h-${opt.value}`}
              type="button"
              onClick={() => onHeightMode(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-label-caps border transition-colors ${
                heightMode === opt.value
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {heightMode === 'exact' ? (
          <>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="175 o 1,75 (metros)"
              className={formInputClass}
              {...register('heightCm' as Path<T>)}
            />
            <p className="text-[10px] text-on-surface-variant">
              Centímetros (175) o metros (1,75). Sin decimales, 2 o 3 = 2 m / 3 m.
            </p>
          </>
        ) : null}
        {heightMode === 'approx' ? (
          <select className={formInputClass} {...register('heightBand' as Path<T>, { required: true })}>
            <option value="">— Elige un rango —</option>
            {HEIGHT_BANDS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className={formLabelClass}>Peso</label>
        <div className="flex flex-wrap gap-2">
          {modeOptions.map((opt) => (
            <button
              key={`w-${opt.value}`}
              type="button"
              onClick={() => onWeightMode(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-label-caps border transition-colors ${
                weightMode === opt.value
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {weightMode === 'exact' ? (
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="ej. 42 o 42,5"
            className={formInputClass}
            {...register('weightKg' as Path<T>)}
          />
        ) : null}
        {weightMode === 'approx' ? (
          <select className={formInputClass} {...register('weightBand' as Path<T>, { required: true })}>
            <option value="">— Elige un rango —</option>
            {WEIGHT_BANDS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
}
