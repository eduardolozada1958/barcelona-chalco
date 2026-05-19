const DEFAULT_API_HOST = 'https://barcelona-chalco.onrender.com';

/** Despierta el backend en Render Free antes de que el usuario envíe el login. */
export function warmApiBackend(): void {
  if (import.meta.env.MODE === 'development') return;

  const host = String(import.meta.env.VITE_API_URL || DEFAULT_API_HOST).replace(/\/$/, '');
  void fetch(`${host}/health`, { mode: 'cors', cache: 'no-store' }).catch(() => {
    /* ignorar — solo precalentar */
  });
}
