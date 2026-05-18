import { z } from 'zod';

import { sanitizeIlikeSearchTerm } from '@shared/utils/sanitize-search';

const pagination = {
  page:  z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform(v => {
    const n = v ? parseInt(v, 10) : 20;
    return Math.min(100, Math.max(1, n));
  }),
} as const;

export const listParentsQuerySchema = z.object({
  ...pagination,
  search: z.string().optional().transform((v) => sanitizeIlikeSearchTerm(v)),
});

export const parentIdParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const updateParentBodySchema = z.object({
  firstName:             z.string().min(2).max(100).optional(),
  lastName:              z.string().min(2).max(100).optional(),
  phonePrimary:          z.string().max(30).optional(),
  phoneSecondary:        z.string().max(30).nullable().optional(),
  relationship:          z
    .enum(['padre', 'madre', 'tutor', 'tutora', 'abuelo', 'abuela', 'tio', 'tia', 'otro'])
    .optional(),
  occupation:            z.string().max(100).nullable().optional(),
  emergencyContactName:  z.string().max(150).nullable().optional(),
  emergencyContactPhone: z.string().max(30).nullable().optional(),
  notes:                 z.string().max(2000).nullable().optional(),
});

export type ListParentsQuery = z.infer<typeof listParentsQuerySchema>;
export type UpdateParentBody = z.infer<typeof updateParentBodySchema>;
