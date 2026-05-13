import { z } from 'zod';

const pagination = {
  page:  z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform(v => {
    const n = v ? parseInt(v, 10) : 20;
    return Math.min(100, Math.max(1, n));
  }),
} as const;

export const inscriptionIdParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const listInscriptionsQuerySchema = z.object({
  ...pagination,
  status:   z
    .enum(['pending', 'under_review', 'approved', 'rejected', 'waitlist'])
    .optional(),
  category: z.string().optional(),
});

export const publicInscriptionBodySchema = z.object({
  parentFirstName:        z.string().min(2).max(100),
  parentLastName:         z.string().min(2).max(100),
  parentEmail:            z.string().email().max(255),
  parentPhone:            z.string().min(5).max(30),
  parentRelationship:     z
    .enum(['padre', 'madre', 'tutor', 'tutora', 'abuelo', 'abuela', 'tio', 'tia', 'otro'])
    .default('padre'),
  playerFirstName:        z.string().min(2).max(100),
  playerLastName:         z.string().min(2).max(100),
  playerBirthDate:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  playerNationality:      z.string().max(100).default('Mexicana'),
  playerPosition:         z.string().min(2).max(80),
  playerDominantFoot:     z.enum(['right', 'left', 'both']).default('right'),
  playerHeightCm:         z.number().int().min(80).max(250).optional(),
  playerWeightKg:         z.number().int().min(15).max(150).optional(),
  playerCategory:         z.string().min(1).max(50),
  playerPreviousClub:     z.string().max(150).nullable().optional(),
  playerSportDescription: z.string().max(1000).nullable().optional(),
  playerAvatarUrl:        z.string().url().nullable().optional(),
});

export const approveInscriptionBodySchema = z.object({
  reviewNotes: z.string().max(2000).nullable().optional(),
});

export const rejectInscriptionBodySchema = z.object({
  rejectionReason: z.string().min(3).max(2000),
  reviewNotes:     z.string().max(2000).nullable().optional(),
});

export type ListInscriptionsQuery = z.infer<typeof listInscriptionsQuerySchema>;
export type PublicInscriptionBody = z.infer<typeof publicInscriptionBodySchema>;
export type ApproveInscriptionBody = z.infer<typeof approveInscriptionBodySchema>;
export type RejectInscriptionBody = z.infer<typeof rejectInscriptionBodySchema>;
