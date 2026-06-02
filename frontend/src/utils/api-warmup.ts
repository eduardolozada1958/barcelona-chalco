/** Despierta el backend (Worker → Render) antes del login. */
export function warmApiBackend(): void {
  if (import.meta.env.MODE === 'development') return;

  void fetch('/health', { cache: 'no-store' }).catch(() => {
    /* ignorar — solo precalentar */
  });
}
