import { z } from 'zod';

export const subscribePushBodySchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth:   z.string().min(1).max(256),
  }),
});

export const unsubscribePushBodySchema = z.object({
  endpoint: z.string().url().max(2048),
});

export type SubscribePushBody = z.infer<typeof subscribePushBodySchema>;
export type UnsubscribePushBody = z.infer<typeof unsubscribePushBodySchema>;
