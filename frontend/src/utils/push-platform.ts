/** iPhone, iPad o iPadOS con teclado (MacIntel + touch). */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** App abierta desde icono en inicio (requerido para push en iOS Safari). */
export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
}

export function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPR|Chromium/i.test(ua);
}

/** En iOS, push solo funciona en PWA instalada; en Mac Safari funciona en pestaña. */
export function iosPushRequiresHomeScreen(): boolean {
  return isIOS() && !isStandalonePwa();
}
