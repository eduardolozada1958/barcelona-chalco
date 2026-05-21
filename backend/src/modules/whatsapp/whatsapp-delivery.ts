import { BadRequestError } from '@middlewares/error.middleware';
import { logger } from '@shared/utils/logger';
import { formatPhoneForDisplay, normalizePhoneDigits, phoneToWhatsAppJid } from './phone';

/** Dígitos internacionales del JID conectado (chip del club). */
export function jidToPhoneDigits(jid: string | null | undefined): string | null {
  if (!jid) return null;
  const local = jid.split('@')[0]?.split(':')[0] ?? '';
  return normalizePhoneDigits(local) ?? (local.replace(/\D/g, '') || null);
}

/** Resuelve JID real vía WhatsApp (Baileys 7 / LID); valida que el número tenga WA. */
export async function resolveWhatsAppDeliveryJid(
  sock: { onWhatsApp?: (...phoneNumber: string[]) => Promise<unknown> },
  phoneRaw: string,
): Promise<string> {
  const constructed = phoneToWhatsAppJid(phoneRaw);
  const digits = normalizePhoneDigits(phoneRaw);
  if (!constructed || !digits) {
    throw new BadRequestError(
      `Teléfono inválido (${phoneRaw}). Usa 10 dígitos de México, ej. 5512345678.`,
    );
  }

  const onWa = sock.onWhatsApp;
  if (typeof onWa !== 'function') {
    return constructed;
  }

  try {
    const rows = (await onWa(`${digits}@s.whatsapp.net`, digits)) as
      | Array<{ jid: string; exists: boolean } | undefined>
      | undefined;
    const hit = rows?.find((r) => r?.exists);
    if (!hit?.jid) {
      throw new BadRequestError(
        `El número ${formatPhoneForDisplay(phoneRaw)} no tiene WhatsApp activo o no es válido. ` +
          'Confirma el celular en Mi perfil (el que usas en WhatsApp).',
      );
    }
    logger.info('WhatsApp: destino verificado en WA', {
      input: phoneRaw,
      digits,
      jid: hit.jid,
      constructed,
    });
    return hit.jid;
  } catch (e) {
    if (e instanceof BadRequestError) throw e;
    logger.warn('WhatsApp: onWhatsApp falló, usando JID construido', { err: e, constructed });
    return constructed;
  }
}
