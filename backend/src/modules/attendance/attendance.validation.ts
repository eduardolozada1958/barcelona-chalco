import { z } from 'zod';

export const attendancePeriodQuerySchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/).optional(),
});

export const attendanceUpsertBodySchema = z.object({
  periodMonth: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/),
  records: z.array(
    z.object({
      playerId: z.string().uuid(),
      date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      present:  z.boolean(),
    }),
  ).max(500),
});

export type AttendanceUpsertBody = z.infer<typeof attendanceUpsertBodySchema>;
