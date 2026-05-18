import { z } from 'zod';
import { CURRENT_SEASON } from '@config/constants';
import { sanitizeIlikeSearchTerm } from '@shared/utils/sanitize-search';

const pagination = {
  page:  z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform(v => {
    const n = v ? parseInt(v, 10) : 20;
    return Math.min(100, Math.max(1, n));
  }),
} as const;

export const matchIdParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const listMatchesQuerySchema = z.object({
  ...pagination,
  category: z.string().optional(),
  status:   z
    .enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'])
    .optional(),
  season:   z.string().optional(),
  search:   z.string().optional().transform((v) => sanitizeIlikeSearchTerm(v)),
});

const lineupPlayerIds = z.array(z.string().uuid()).max(11);

export const createMatchBodySchema = z.object({
  title:             z.string().min(3).max(200),
  description:       z.string().max(5000).nullable().optional(),
  opponentName:      z.string().min(2).max(150),
  opponentLogoUrl:   z.string().url().nullable().optional(),
  matchDate:         z.string().datetime({ offset: true }),
  location:          z.string().min(2).max(200),
  locationMapsUrl:   z.string().url().nullable().optional(),
  matchType:         z.enum(['league', 'cup', 'friendly', 'tournament', 'internal']).default('league'),
  category:          z.enum(['General']).default('General'),
  status:            z
    .enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'])
    .default('scheduled'),
  isHome:            z.boolean().default(true),
  bannerUrl:         z.string().url().nullable().optional(),
  season:            z.string().max(20).default(CURRENT_SEASON),
  formationType:     z.enum(['football_7', 'football_11']).nullable().optional(),
  startingLineup:    lineupPlayerIds.nullable().optional(),
});

export const updateMatchBodySchema = createMatchBodySchema.partial();

export const convocatoryBodySchema = z.object({
  playerIds: z.array(z.string().uuid()).min(1).max(50),
});

export type ListMatchesQuery = z.infer<typeof listMatchesQuerySchema>;
export type CreateMatchBody = z.infer<typeof createMatchBodySchema>;
export type UpdateMatchBody = z.infer<typeof updateMatchBodySchema>;
export type ConvocatoryBody = z.infer<typeof convocatoryBodySchema>;
