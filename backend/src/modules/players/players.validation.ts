import { z } from 'zod';

import { isPlayerSlug, isPlayerUuid } from '@shared/utils/player-slug';
import { sanitizeIlikeSearchTerm } from '@shared/utils/sanitize-search';

export const playerIdSchema = z.object({
  id: z.string().uuid('ID de jugador inválido'),
});

/** UUID interno o slug público (/jugadores/eduardo-lozada-quiroz). */
export const setMvpOfWeekBodySchema = z.object({
  playerId:  z.string().uuid('ID de jugador inválido').nullable(),
  weekLabel: z.string().trim().max(120, 'Máximo 120 caracteres').nullable().optional(),
});

export type SetMvpOfWeekBody = z.infer<typeof setMvpOfWeekBodySchema>;

export const playerPublicRefSchema = z.object({
  id: z
    .string()
    .min(2)
    .max(120)
    .refine((v) => isPlayerUuid(v) || isPlayerSlug(v), 'Referencia de jugador inválida'),
});

/** Altura: cm (175) o metros con decimal (1,75). Enteros 1–3 se interpretan como metros (2 → 200 cm). */
function normalizeHeightCmInput(v: unknown): unknown {
  if (v === undefined || v === null || v === '') return undefined;
  const raw = String(v).trim().replace(',', '.');
  if (raw === '') return undefined;
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return undefined;
  const hasDecimal = raw.includes('.');
  if (hasDecimal && n > 0 && n < 10) return Math.round(n * 100);
  if (!hasDecimal && Number.isInteger(n) && n >= 1 && n <= 3) return n * 100;
  return Math.round(n);
}

function normalizeWeightKgInput(v: unknown): unknown {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'number' ? v : parseFloat(String(v).trim().replace(',', '.'));
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n);
}

export const createPlayerSchema = z.object({
  firstName:         z.string().min(2).max(100),
  lastName:          z.string().min(2).max(100),
  birthDate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha: YYYY-MM-DD'),
  nationality:       z.string().max(100).default('Mexicana'),
  position:          z.string().min(2).max(80),
  secondaryPosition: z.string().max(80).optional(),
  jerseyNumber:      z.number().int().min(1).max(99).optional(),
  dominantFoot:      z.enum(['right', 'left', 'both']).default('right'),
  heightCm: z.preprocess(normalizeHeightCmInput, z.number().int().min(80).max(250).optional()),
  weightKg: z.preprocess(normalizeWeightKgInput, z.number().int().min(15).max(150).optional()),
  category: z
    .enum(['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'General'])
    .optional()
    .default('General'),
  sportDescription:  z.string().max(1000).optional(),
  avatarUrl:         z.string().url().optional(),
  achievements:      z.string().max(500).optional(),
  notes:             z.string().max(500).optional(),
  curp: z
    .union([
      z.literal(''),
      z.string().length(18).regex(/^[A-Z0-9Ñ]{18}$/i),
    ])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

export const updatePlayerSchema = createPlayerSchema.partial().extend({
  curp: z
    .union([
      z.literal(''),
      z.string().length(18).regex(/^[A-Z0-9Ñ]{18}$/i),
      z.null(),
    ])
    .optional()
    .transform((v) => (v === '' ? null : v)),
  /** Estado en plantilla (listados públicos filtran `active`). */
  status: z.enum(['active', 'inactive']).optional(),
  /** Marcar verificado registra fecha y usuario; desmarcar limpia verificación. */
  isVerified: z.boolean().optional(),
});

export const listPlayersQuerySchema = z.object({
  page:       z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  limit:      z.string().optional().transform(v => (v ? parseInt(v, 10) : 20)),
  category:   z.string().optional(),
  status:     z.string().optional(),
  search:     z.string().optional().transform((v) => sanitizeIlikeSearchTerm(v)),
  season:     z.string().optional(),
  isVerified: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
});

export type ListPlayersQuery = z.infer<typeof listPlayersQuerySchema>;

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;

const emptyToUndef = (v: unknown): undefined | string | number =>
  v === '' || v === undefined || v === null ? undefined : (v as string | number);

function optionalIntFromForm(min: number, max: number) {
  return z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      const u = emptyToUndef(v);
      if (u === undefined) return undefined;
      const n = typeof u === 'number' ? u : parseInt(String(u), 10);
      return Number.isFinite(n) ? n : undefined;
    })
    .refine((n) => n === undefined || (n >= min && n <= max), 'Valor numérico fuera de rango');
}

/** Campos de formulario multipart (todos string salvo números enviados como string). */
export const createPlayerMultipartFieldsSchema = z.object({
  firstName:         z.string().min(2).max(100),
  lastName:          z.string().min(2).max(100),
  birthDate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha: YYYY-MM-DD'),
  nationality:       z.string().max(100).optional().transform((v) => (!v || v === '' ? 'Mexicana' : v)),
  position:          z.string().min(2).max(80),
  secondaryPosition: z.string().max(80).optional().transform((v) => (v === '' ? undefined : v)),
  jerseyNumber:      optionalIntFromForm(1, 99),
  dominantFoot:      z.enum(['right', 'left', 'both']).default('right'),
  heightCm: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => normalizeHeightCmInput(v) as number | undefined)
    .refine(
      (n) => n === undefined || (typeof n === 'number' && n >= 80 && n <= 250),
      { message: 'Altura entre 80 y 250 cm (ej. 175, o metros: 1,75; entero 2 = 2 m).' },
    ),
  weightKg: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => normalizeWeightKgInput(v) as number | undefined)
    .refine(
      (n) => n === undefined || (typeof n === 'number' && n >= 15 && n <= 150),
      { message: 'Peso entre 15 y 150 kg (admite decimales, ej. 70,5).' },
    ),
  category: z
    .union([
      z.literal(''),
      z.enum(['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'General']),
    ])
    .optional()
    .transform((v) => (v === undefined || v === '' ? 'General' : v)),
  sportDescription:  z.string().max(1000).optional().transform((v) => (v === '' ? undefined : v)),
  achievements:      z.string().max(500).optional().transform((v) => (v === '' ? undefined : v)),
  notes:             z.string().max(500).optional().transform((v) => (v === '' ? undefined : v)),
  curp: z
    .union([
      z.literal(''),
      z.string().length(18).regex(/^[A-Z0-9Ñ]{18}$/i),
    ])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

export type CreatePlayerMultipartInput = z.infer<typeof createPlayerMultipartFieldsSchema>;
