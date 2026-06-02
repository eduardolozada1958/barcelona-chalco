/** Despierta el backend (Pages → Worker → Render) antes del login. */
export function warmApiBackend(): void {
  if (import.meta.env.MODE === 'development') return;

  void fetch('/api/v1/settings/public', { cache: 'no-store' }).catch(() => {
    /* ignorar — solo precalentar */
  });
}
