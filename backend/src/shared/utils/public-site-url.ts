import { env } from '@config/env';

/** URL base del sitio público (sin slash final). Usada en QR → `/credencial-ar/:token`. */
export function publicSiteBaseUrl(): string {
  const explicit = env.APP_PUBLIC_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const first = env.CORS_ORIGIN.split(',')[0]?.trim() ?? env.CORS_ORIGIN;
  return first.replace(/\/$/, '');
}
