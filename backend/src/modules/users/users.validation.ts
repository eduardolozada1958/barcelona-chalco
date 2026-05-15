import { z } from 'zod';

const pagination = {
  page:  z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform(v => {
    const n = v ? parseInt(v, 10) : 20;
    return Math.min(100, Math.max(1, n));
  }),
} as const;

export const listUsersQuerySchema = z.object({
  ...pagination,
  role:   z.enum(['admin', 'coach', 'parent']).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  search: z.string().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const createUserBodySchema = z.object({
  email:    z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  fullName: z.string().min(2).max(150),
  role:     z.enum(['admin', 'coach']),
  phone:    z.string().max(30).nullable().optional(),
});

export const updateUserBodySchema = z.object({
  fullName:  z.string().min(2).max(150).optional(),
  phone:     z.string().max(30).nullable().optional(),
  status:    z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  role:      z.enum(['admin', 'coach', 'parent']).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
