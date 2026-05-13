import { z } from 'zod';

const pagination = {
  page:  z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform(v => {
    const n = v ? parseInt(v, 10) : 20;
    return Math.min(100, Math.max(1, n));
  }),
} as const;

export const noticeIdParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const listNoticesQuerySchema = z.object({
  ...pagination,
  type:     z.enum(['general', 'urgent', 'event', 'training', 'match', 'administrative']).optional(),
  audience: z.enum(['all', 'parents', 'players', 'coaches', 'specific_category']).optional(),
});

export const createNoticeBodySchema = z.object({
  title:           z.string().min(3).max(200),
  content:         z.string().min(10).max(20000),
  type:            z.enum(['general', 'urgent', 'event', 'training', 'match', 'administrative']).default('general'),
  audience:        z.enum(['all', 'parents', 'players', 'coaches', 'specific_category']).default('all'),
  targetCategory:  z.string().max(50).nullable().optional(),
  isPinned:        z.boolean().default(false),
  coverImageUrl:   z.string().url().nullable().optional(),
  expiresAt:       z.string().datetime({ offset: true }).nullable().optional(),
});

export const updateNoticeBodySchema = createNoticeBodySchema.partial();

export type ListNoticesQuery = z.infer<typeof listNoticesQuerySchema>;
export type CreateNoticeBody = z.infer<typeof createNoticeBodySchema>;
export type UpdateNoticeBody = z.infer<typeof updateNoticeBodySchema>;
