/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Base pública del sitio (ej. https://barcelona-chalco.pages.dev) para URLs en QR; si falta, se usa window.location.origin. */
  readonly VITE_PUBLIC_APP_URL?: string;
  /**
   * URL del iframe de Google Maps para Cancha Walmart (solo el `src`, https://www.google.com/maps/embed?...).
   * Configúrala en Cloudflare Pages → Settings → Environment variables (Production).
   */
  readonly VITE_VENUE_WALMART_MAP_EMBED_URL?: string;
  /** Igual que Walmart, para Cancha Atlas. */
  readonly VITE_VENUE_ATLAS_MAP_EMBED_URL?: string;
  /** Canchas 100 (Fútbol rápido). Opcional: el front ya trae URL por defecto. */
  readonly VITE_VENUE_CANCHAS100_MAP_EMBED_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
