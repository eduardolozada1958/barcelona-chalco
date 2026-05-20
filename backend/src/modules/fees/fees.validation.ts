import { z } from 'zod';

export const feesPeriodQuerySchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/).optional(),
});

export const updatePlayerFeesBodySchema = z.object({
  periodMonth: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/),
  registrationPaid: z.boolean().optional(),
  monthlyFeePaid:   z.boolean().optional(),
  notes:            z.string().max(500).nullable().optional(),
});

export type UpdatePlayerFeesBody = z.infer<typeof updatePlayerFeesBodySchema>;

export const playerIdParamSchema = z.object({
  playerId: z.string().uuid(),
});
