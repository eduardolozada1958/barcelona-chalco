/**
 * Sedes fijas del club (3 canchas). URLs de Google Maps embebido por defecto;
 * opcionalmente puedes sobreescribirlas con variables VITE_* en Cloudflare/Pages.
 */

export const VENUE_PRESET_IDS = ['walmart', 'atlas', 'canchas100', 'other'] as const;
export type VenuePresetId = (typeof VENUE_PRESET_IDS)[number];

export const WALMART_FIELD_OPTIONS = [
  { value: '1', label: 'Campo 1' },
  { value: '2', label: 'Campo 2' },
  { value: '3', label: 'Campo 3' },
] as const;

export type WalmartFieldId = (typeof WALMART_FIELD_OPTIONS)[number]['value'];

export interface VenuePreset {
  id: Exclude<VenuePresetId, 'other'>;
  label: string;
  locationLabel: string;
  embedMapUrl: string | null;
}

/** Defaults desde iframes compartidos por el club (solo el `src`). */
const EMBED_DEFAULTS = {
  walmart:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3766.4660090208513!2d-98.88019092662552!3d19.262090546107753!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85ce1fb4353bb2db%3A0xb19db466be2414ae!2sNEZA%20CHALCO%20FUT!5e0!3m2!1ses!2smx!4v1778825744717!5m2!1ses!2smx',
  atlas:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1150.7147837975624!2d-98.84376168590573!3d19.25995870480258!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85ce1f4aacc3792b%3A0xd05a5bdbf8d168a9!2sESC.%20DE%20F%C3%9ATBOL%20PANTERAS%20FC.%20CHALCO.%20CANCHA%20LA%20SELVA!5e0!3m2!1ses!2smx!4v1778825604620!5m2!1ses!2smx',
  canchas100:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1883.3283783227164!2d-98.83966327053086!3d19.253785352361252!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85ce18a965d7cfe5%3A0x122df2fef7eb4fa2!2sCancha%20100%20Futbol%20Rapido!5e0!3m2!1ses!2smx!4v1778825789926!5m2!1ses!2smx',
} as const;

function envStr(key: string): string {
  const v = (import.meta.env as Record<string, string | undefined>)[key];
  return (v ?? '').trim();
}

export const CANCHAS_PRESETS: readonly VenuePreset[] = [
  {
    id: 'walmart',
    label: 'Cancha Walmart',
    locationLabel: 'Cancha Walmart',
    embedMapUrl: envStr('VITE_VENUE_WALMART_MAP_EMBED_URL') || EMBED_DEFAULTS.walmart,
  },
  {
    id: 'atlas',
    label: 'Cancha Atlas',
    locationLabel: 'Cancha Atlas',
    embedMapUrl: envStr('VITE_VENUE_ATLAS_MAP_EMBED_URL') || EMBED_DEFAULTS.atlas,
  },
  {
    id: 'canchas100',
    label: 'Canchas 100',
    locationLabel: 'Canchas 100',
    embedMapUrl: envStr('VITE_VENUE_CANCHAS100_MAP_EMBED_URL') || EMBED_DEFAULTS.canchas100,
  },
];

export function formatWalmartLocation(field: WalmartFieldId): string {
  return `Cancha Walmart — Campo ${field}`;
}

/** Interpreta lo guardado en `matches.location` para rellenar formularios. */
export function parseStoredLocation(location: string): {
  venuePreset: VenuePresetId;
  walmartField: WalmartFieldId | '';
  locationOther: string;
} {
  const loc = location.trim();
  const wm = /^Cancha Walmart — Campo ([123])$/.exec(loc);
  if (wm) {
    return { venuePreset: 'walmart', walmartField: wm[1] as WalmartFieldId, locationOther: '' };
  }
  const preset = CANCHAS_PRESETS.find((p) => p.locationLabel === loc);
  if (preset) return { venuePreset: preset.id, walmartField: '', locationOther: '' };
  if (loc === 'Cancha Walmart') return { venuePreset: 'walmart', walmartField: '', locationOther: '' };
  return { venuePreset: 'other', walmartField: '', locationOther: loc };
}

export function resolveVenueSelection(
  preset: VenuePresetId,
  otherLocation: string,
  otherMapsUrl: string,
  walmartField?: WalmartFieldId | '',
): { location: string; locationMapsUrl: string | null } {
  if (preset === 'other') {
    const maps = otherMapsUrl.trim();
    return {
      location: otherLocation.trim(),
      locationMapsUrl: maps.length > 0 ? maps : null,
    };
  }
  const p = CANCHAS_PRESETS.find((x) => x.id === preset);
  if (!p) return { location: '', locationMapsUrl: null };
  if (preset === 'walmart' && walmartField) {
    return { location: formatWalmartLocation(walmartField), locationMapsUrl: p.embedMapUrl };
  }
  return { location: p.locationLabel, locationMapsUrl: p.embedMapUrl };
}
