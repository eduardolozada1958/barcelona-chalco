/** Modo de captura: exacto, rango aproximado o sin registrar. */
export type PhysiqueFieldMode = 'exact' | 'approx' | 'skip';

export type PhysiqueFormFields = {
  heightMode: PhysiqueFieldMode;
  heightCm: string;
  heightBand: string;
  weightMode: PhysiqueFieldMode;
  weightKg: string;
  weightBand: string;
};

export const defaultPhysiqueFormFields: PhysiqueFormFields = {
  heightMode: 'skip',
  heightCm: '',
  heightBand: '',
  weightMode: 'skip',
  weightKg: '',
  weightBand: '',
};

export const HEIGHT_BANDS = [
  { id: 'u120', label: 'Menos de 1,20 m', cm: 115 },
  { id: '120_130', label: '1,20 – 1,30 m', cm: 125 },
  { id: '130_140', label: '1,30 – 1,40 m', cm: 135 },
  { id: '140_150', label: '1,40 – 1,50 m', cm: 145 },
  { id: '150_160', label: '1,50 – 1,60 m', cm: 155 },
  { id: '160_170', label: '1,60 – 1,70 m', cm: 165 },
  { id: '170_180', label: '1,70 – 1,80 m', cm: 175 },
  { id: 'o180', label: 'Más de 1,80 m', cm: 185 },
] as const;

export const WEIGHT_BANDS = [
  { id: 'u25', label: 'Menos de 25 kg', kg: 23 },
  { id: '25_30', label: '25 – 30 kg', kg: 28 },
  { id: '30_35', label: '30 – 35 kg', kg: 33 },
  { id: '35_40', label: '35 – 40 kg', kg: 38 },
  { id: '40_45', label: '40 – 45 kg', kg: 43 },
  { id: '45_50', label: '45 – 50 kg', kg: 48 },
  { id: '50_55', label: '50 – 55 kg', kg: 53 },
  { id: '55_60', label: '55 – 60 kg', kg: 58 },
  { id: '60_70', label: '60 – 70 kg', kg: 65 },
  { id: 'o70', label: 'Más de 70 kg', kg: 75 },
] as const;

const HEIGHT_BAND_CM = new Set<number>(HEIGHT_BANDS.map((b) => b.cm));
const WEIGHT_BAND_KG = new Set<number>(WEIGHT_BANDS.map((b) => b.kg));

/** Misma lógica que el backend: cm (175), metros con decimal (1,75), o entero 1–3 como metros. */
export function parseHeightCmForBody(raw: string): number | undefined {
  const t = raw.trim().replace(',', '.');
  if (!t) return undefined;
  const n = parseFloat(t);
  if (!Number.isFinite(n)) return undefined;
  const hasDecimal = t.includes('.');
  if (hasDecimal && n > 0 && n < 10) return Math.round(n * 100);
  if (!hasDecimal && Number.isInteger(n) && n >= 1 && n <= 3) return n * 100;
  return Math.round(n);
}

export function parseWeightKgForBody(raw: string): number | undefined {
  const t = raw.trim().replace(',', '.');
  if (!t) return undefined;
  const n = parseFloat(t);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n);
}

function heightBandForCm(cm: number): string {
  const hit = HEIGHT_BANDS.find((b) => b.cm === cm);
  if (hit) return hit.id;
  if (cm < 120) return 'u120';
  if (cm <= 130) return '120_130';
  if (cm <= 140) return '130_140';
  if (cm <= 150) return '140_150';
  if (cm <= 160) return '150_160';
  if (cm <= 170) return '160_170';
  if (cm <= 180) return '170_180';
  return 'o180';
}

function weightBandForKg(kg: number): string {
  const hit = WEIGHT_BANDS.find((b) => b.kg === kg);
  if (hit) return hit.id;
  if (kg < 25) return 'u25';
  if (kg <= 30) return '25_30';
  if (kg <= 35) return '30_35';
  if (kg <= 40) return '35_40';
  if (kg <= 45) return '40_45';
  if (kg <= 50) return '45_50';
  if (kg <= 55) return '50_55';
  if (kg <= 60) return '55_60';
  if (kg <= 70) return '60_70';
  return 'o70';
}

/** Rellena el formulario al editar según valores guardados en BD. */
export function physiqueFieldsFromStored(
  heightCm: number | null | undefined,
  weightKg: number | null | undefined,
): PhysiqueFormFields {
  const out = { ...defaultPhysiqueFormFields };
  if (heightCm != null && Number.isFinite(heightCm)) {
    if (HEIGHT_BAND_CM.has(heightCm)) {
      out.heightMode = 'approx';
      out.heightBand = heightBandForCm(heightCm);
    } else {
      out.heightMode = 'exact';
      out.heightCm = String(heightCm);
    }
  }
  if (weightKg != null && Number.isFinite(weightKg)) {
    if (WEIGHT_BAND_KG.has(weightKg)) {
      out.weightMode = 'approx';
      out.weightBand = weightBandForKg(weightKg);
    } else {
      out.weightMode = 'exact';
      out.weightKg = String(weightKg);
    }
  }
  return out;
}

export function resolveHeightCmFromForm(fields: PhysiqueFormFields): number | undefined {
  if (fields.heightMode === 'skip') return undefined;
  if (fields.heightMode === 'approx') {
    const band = HEIGHT_BANDS.find((b) => b.id === fields.heightBand);
    return band?.cm;
  }
  const parsed = parseHeightCmForBody(fields.heightCm);
  return parsed;
}

export function resolveWeightKgFromForm(fields: PhysiqueFormFields): number | undefined {
  if (fields.weightMode === 'skip') return undefined;
  if (fields.weightMode === 'approx') {
    const band = WEIGHT_BANDS.find((b) => b.id === fields.weightBand);
    return band?.kg;
  }
  return parseWeightKgForBody(fields.weightKg);
}

export type PhysiqueResolveError = { field: 'height' | 'weight'; message: string };

export function validatePhysiqueFields(fields: PhysiqueFormFields): PhysiqueResolveError | null {
  if (fields.heightMode === 'approx' && !fields.heightBand) {
    return { field: 'height', message: 'Elige un rango de estatura aproximado' };
  }
  if (fields.heightMode === 'exact' && fields.heightCm.trim()) {
    const h = resolveHeightCmFromForm(fields);
    if (h === undefined || h < 80 || h > 250) {
      return {
        field: 'height',
        message: 'Estatura: usa centímetros (175) o metros (1,75). Enteros 2 o 3 = 2 m / 3 m.',
      };
    }
  }
  if (fields.weightMode === 'approx' && !fields.weightBand) {
    return { field: 'weight', message: 'Elige un rango de peso aproximado' };
  }
  if (fields.weightMode === 'exact' && fields.weightKg.trim()) {
    const w = resolveWeightKgFromForm(fields);
    if (w === undefined || w < 15 || w > 150) {
      return { field: 'weight', message: 'Peso entre 15 y 150 kg (admite decimales, ej. 70,5).' };
    }
  }
  return null;
}
