import { z } from 'zod';

import { isValidCurpFormat, normalizeCurp } from '@shared/utils/curp';
import { sanitizeIlikeSearchTerm } from '@shared/utils/sanitize-search';

const pagination = {
  page:  z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform(v => {
    const n = v ? parseInt(v, 10) : 20;
    return Math.min(100, Math.max(1, n));
  }),
} as const;

const parentRelationship = z.enum([
  'padre', 'madre', 'tutor', 'tutora', 'abuelo', 'abuela', 'tio', 'tia', 'otro',
]);

export const listParentsQuerySchema = z.object({
  ...pagination,
  search: z.string().optional().transform((v) => sanitizeIlikeSearchTerm(v)),
});

export const parentIdParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const linkRequestIdParamSchema = z.object({
  id: z.string().uuid('ID de solicitud inválido'),
});

export const updateParentBodySchema = z.object({
  firstName:             z.string().min(2).max(100).optional(),
  lastName:              z.string().min(2).max(100).optional(),
  phonePrimary:          z.string().max(30).optional(),
  phoneSecondary:        z.string().max(30).nullable().optional(),
  relationship:          parentRelationship.optional(),
  occupation:            z.string().max(100).nullable().optional(),
  emergencyContactName:  z.string().max(150).nullable().optional(),
  emergencyContactPhone: z.string().max(30).nullable().optional(),
  notes:                 z.string().max(2000).nullable().optional(),
});

export const createLinkRequestSchema = z.object({
  curp: z
    .string()
    .min(18, 'La CURP debe tener 18 caracteres')
    .max(18)
    .transform(normalizeCurp)
    .refine(isValidCurpFormat, 'Formato de CURP inválido'),
  relationship: parentRelationship,
  isPrimaryContact: z.boolean().optional().default(false),
});

export const listLinkRequestsQuerySchema = z.object({
  ...pagination,
  status: z.enum(['pending', 'approved', 'rejected', 'all']).optional().default('pending'),
});

export const rejectLinkRequestSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type ListParentsQuery = z.infer<typeof listParentsQuerySchema>;
export type UpdateParentBody = z.infer<typeof updateParentBodySchema>;
export type CreateLinkRequestInput = z.infer<typeof createLinkRequestSchema>;
export type ListLinkRequestsQuery = z.infer<typeof listLinkRequestsQuerySchema>;
export type RejectLinkRequestInput = z.infer<typeof rejectLinkRequestSchema>;
