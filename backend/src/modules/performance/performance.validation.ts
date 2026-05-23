import { z } from 'zod';

const pagination = {
  page:  z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => {
    const n = v ? parseInt(v, 10) : 20;
    return Math.min(100, Math.max(1, n));
  }),
} as const;

export const performanceReportIdParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const performanceEntrySchema = z.object({
  playerName:  z.string().min(2).max(200),
  advance:     z.string().min(2).max(3000),
  difficulty:  z.string().max(3000).optional().default(''),
  playerId:    z.string().uuid().optional().nullable(),
});

export const createPerformanceReportSchema = z.object({
  title:      z.string().min(3).max(200),
  category:   z.string().min(2).max(80).default('General'),
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
  entries:    z.array(performanceEntrySchema).min(1).max(40),
});

export const updatePerformanceReportSchema = createPerformanceReportSchema.partial();

export const listPerformanceReportsQuerySchema = z.object({
  ...pagination,
  published: z.enum(['true', 'false']).optional(),
});

export type CreatePerformanceReportBody = z.infer<typeof createPerformanceReportSchema>;
export type UpdatePerformanceReportBody = z.infer<typeof updatePerformanceReportSchema>;
export type ListPerformanceReportsQuery = z.infer<typeof listPerformanceReportsQuerySchema>;
