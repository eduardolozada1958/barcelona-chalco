/**
 * Base URL del API en producción: mismo origen (Pages → Worker → Render).
 * Override con VITE_API_URL solo para desarrollo/staging.
 */
export function getApiV1BaseUrl(): string {
  if (import.meta.env.MODE === 'development') {
    return '/api/v1';
  }
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) {
    return `${envUrl.replace(/\/$/, '')}/api/v1`;
  }
  return '/api/v1';
}
