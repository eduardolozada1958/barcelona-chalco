import { z } from 'zod';

const pagination = {
  page:  z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform(v => {
    const n = v ? parseInt(v, 10) : 20;
    return Math.min(100, Math.max(1, n));
  }),
} as const;

export const resultIdParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const listResultsQuerySchema = z.object({
  ...pagination,
  published: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
});

export const createResultBodySchema = z.object({
  matchId:          z.string().uuid(),
  goalsScored:      z.number().int().min(0).default(0),
  goalsConceded:    z.number().int().min(0).default(0),
  matchReport:      z.string().max(10000).nullable().optional(),
  highlightUrl:     z.string().url().nullable().optional(),
  featuredPlayerId: z.string().uuid().nullable().optional(),
});

export const playerStatInputSchema = z.object({
  playerId:      z.string().uuid(),
  goals:         z.number().int().min(0).default(0),
  assists:       z.number().int().min(0).default(0),
  yellowCards:   z.number().int().min(0).max(2).default(0),
  redCards:      z.number().int().min(0).max(1).default(0),
  minutesPlayed: z.number().int().min(0).max(120).default(0),
  rating:        z.number().min(1).max(10).nullable().optional(),
  notes:         z.string().max(500).nullable().optional(),
});

export const updateResultBodySchema = z.object({
  goalsScored:      z.number().int().min(0).optional(),
  goalsConceded:    z.number().int().min(0).optional(),
  matchReport:      z.string().max(10000).nullable().optional(),
  highlightUrl:     z.string().url().nullable().optional(),
  featuredPlayerId: z.string().uuid().nullable().optional(),
  playerStats:      z.array(playerStatInputSchema).max(40).optional(),
});

export type ListResultsQuery = z.infer<typeof listResultsQuerySchema>;
export type CreateResultBody = z.infer<typeof createResultBodySchema>;
export type UpdateResultBody = z.infer<typeof updateResultBodySchema>;
export type PlayerStatInput = z.infer<typeof playerStatInputSchema>;
