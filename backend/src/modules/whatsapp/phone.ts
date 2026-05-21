/** Quita prefijo WhatsApp y devuelve solo dígitos internacionales. */
export function normalizePhoneDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  let n = digits;
  if (n.length === 10) {
    n = `52${n}`;
  }
  // +52 1 33… (a veces ponen un «1» de más): 521XXXXXXXXXX → 52XXXXXXXXXX
  if (n.length === 13 && n.startsWith('521')) {
    n = `52${n.slice(3)}`;
  }
  if (n.length === 11 && n.startsWith('1')) {
    /* EE.UU. / +1 */
  } else if (n.length === 12 && n.startsWith('52')) {
    /* México */
  } else if (n.length >= 10 && n.length <= 15) {
    /* otro país ya con prefijo */
  } else {
    return null;
  }

  return n;
}

/** Normaliza teléfono MX (y 10 dígitos) a JID de WhatsApp. */
export function phoneToWhatsAppJid(phone: string): string | null {
  const n = normalizePhoneDigits(phone);
  if (!n) return null;
  return `${n}@s.whatsapp.net`;
}

/** Para mostrar en admin (últimos 10 dígitos). */
export function formatPhoneForDisplay(phone: string): string {
  const n = normalizePhoneDigits(phone);
  if (!n) return phone;
  if (n.startsWith('52') && n.length >= 12) {
    return `+52 ${n.slice(2, 4)} ${n.slice(4, 8)} ${n.slice(8)}`.replace(/\s+/g, ' ').trim();
  }
  return `+${n}`;
}
