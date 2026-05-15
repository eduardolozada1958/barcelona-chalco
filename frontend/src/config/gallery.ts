export const GALLERY_TYPE_OPTIONS = [
  { value: 'general',          label: 'General' },
  { value: 'match_day',        label: 'Día de partido' },
  { value: 'result',           label: 'Resultado' },
  { value: 'featured_player',  label: 'Jugador destacado' },
  { value: 'training',         label: 'Entrenamiento' },
  { value: 'convocatory',      label: 'Convocatoria' },
  { value: 'achievement',      label: 'Logro' },
] as const;

export type GalleryTypeValue = (typeof GALLERY_TYPE_OPTIONS)[number]['value'];

export function galleryTypeLabel(type: string | undefined | null): string {
  const found = GALLERY_TYPE_OPTIONS.find((o) => o.value === type);
  return found?.label ?? 'General';
}
