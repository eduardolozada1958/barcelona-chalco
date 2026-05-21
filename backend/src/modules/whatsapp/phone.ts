/** Normaliza teléfono MX (y 10 dígitos) a JID de WhatsApp. */
export function phoneToWhatsAppJid(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  let n = digits;
  if (n.length === 10) {
    n = `52${n}`;
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

  return `${n}@s.whatsapp.net`;
}
