import { env } from '@config/env';

/** Lista de orígenes permitidos (CORS_ORIGIN puede ser varios separados por coma). */
export function parseCorsOrigins(): string[] {
  return env.CORS_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}
