import { z } from 'zod';

/** UUID v4 (variantes 1–5) — misma regla que player-slug. */
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const uuidString = z
  .string()
  .trim()
  .regex(UUID_RE, 'ID inválido');

export const idParamSchema = z.object({
  id: uuidString,
});

/** Token QR opaco (hex/base64url); no acepta path traversal ni SQL. */
export const opaqueQrToken = z
  .string()
  .trim()
  .min(32, 'Token inválido')
  .max(128, 'Token inválido')
  .regex(/^[A-Za-z0-9_-]+$/, 'Token inválido');

export const qrTokenParamSchema = z.object({
  token: opaqueQrToken,
});

export const qrPlayerIdParamSchema = z.object({
  id: uuidString,
});

export const qrPlayerImageQuerySchema = z.object({
  token: opaqueQrToken,
  w: z
    .string()
    .optional()
    .transform((v) => {
      const n = v ? parseInt(v, 10) : 384;
      if (Number.isNaN(n)) return 384;
      return Math.min(512, Math.max(192, n));
    }),
});
