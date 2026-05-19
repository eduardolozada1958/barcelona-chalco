import { z } from 'zod';

const pagination = {
  page:  z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform(v => {
    const n = v ? parseInt(v, 10) : 20;
    return Math.min(100, Math.max(1, n));
  }),
} as const;

export const commentResourceType = z.enum(['notice', 'gallery_post']);

export const listCommentsQuerySchema = z.object({
  ...pagination,
  resourceType: commentResourceType,
  resourceId:   z.string().uuid('resourceId inválido'),
});

export const adminListCommentsQuerySchema = z.object({
  ...pagination,
  status: z.enum(['pending', 'approved', 'rejected', 'all']).optional().default('pending'),
  resourceType: commentResourceType.optional(),
});

export const createCommentBodySchema = z.object({
  resourceType: commentResourceType,
  resourceId:   z.string().uuid('resourceId inválido'),
  content:      z.string().trim().min(2, 'Mínimo 2 caracteres').max(1000, 'Máximo 1000 caracteres'),
});

export const commentIdParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const rejectCommentBodySchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type ListCommentsQuery       = z.infer<typeof listCommentsQuerySchema>;
export type AdminListCommentsQuery  = z.infer<typeof adminListCommentsQuerySchema>;
export type CreateCommentBody       = z.infer<typeof createCommentBodySchema>;
export type RejectCommentBody       = z.infer<typeof rejectCommentBodySchema>;
