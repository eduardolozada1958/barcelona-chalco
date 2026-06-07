/** Video de fondo del hero (loop). Archivo estático en public/videos. */
export function getHeroVideoUrl(): string | null {
  const url = import.meta.env.VITE_INTRO_VIDEO_URL?.trim();
  if (url) return url;
  return '/videos/intro-mobile.mp4';
}
