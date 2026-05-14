/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Base pública del sitio (ej. https://barcelona-chalco.pages.dev) para URLs en QR; si falta, se usa window.location.origin. */
  readonly VITE_PUBLIC_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
