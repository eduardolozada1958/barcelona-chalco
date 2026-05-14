import { z } from 'zod';

export const playerIdSchema = z.object({
  id: z.string().uuid('ID de jugador inválido'),
});

export const createPlayerSchema = z.object({
  firstName:         z.string().min(2).max(100),
  lastName:          z.string().min(2).max(100),
  birthDate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha: YYYY-MM-DD'),
  nationality:       z.string().max(100).default('Mexicana'),
  position:          z.string().min(2).max(80),
  secondaryPosition: z.string().max(80).optional(),
  jerseyNumber:      z.number().int().min(1).max(99).optional(),
  dominantFoot:      z.enum(['right', 'left', 'both']).default('right'),
  heightCm:          z.number().int().min(80).max(250).optional(),
  weightKg:          z.number().int().min(15).max(150).optional(),
  category:          z.enum(['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20']),
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
});

export const listPlayersQuerySchema = z.object({
  page:       z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  limit:      z.string().optional().transform(v => (v ? parseInt(v, 10) : 20)),
  category:   z.string().optional(),
  status:     z.string().optional(),
  search:     z.string().optional(),
  season:     z.string().optional(),
  isVerified: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
});

export type ListPlayersQuery = z.infer<typeof listPlayersQuerySchema>;

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
