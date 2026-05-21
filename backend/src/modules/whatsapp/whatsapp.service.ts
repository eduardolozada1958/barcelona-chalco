import QRCode from 'qrcode';
import { env } from '@config/env';
import { BadRequestError } from '@middlewares/error.middleware';
import { logger } from '@shared/utils/logger';
import { NOTICE_TYPES_WITH_WHATSAPP } from './whatsapp.constants';
import { formatPhoneForDisplay } from './phone';
import {
  getConnectedWhatsAppJid,
  getWhatsAppStatus,
  initWhatsAppClient,
  restartWhatsAppClient,
  sendWhatsAppText,
} from './whatsapp.client';
import { listVerifiedParentWhatsAppRecipients } from './whatsapp.recipients';

function publicAppOrigin(): string {
  const raw = env.APP_PUBLIC_URL ?? env.CORS_ORIGIN.split(',')[0]?.trim() ?? '';
  return raw.replace(/\/$/, '');
}

function truncate(text: string, max = 200): string {
  const plain = text.replace(/\s+/g, ' ').trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1)}…`;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let sendsThisHour = 0;
let hourStarted = Date.now();

function resetHourlyCapIfNeeded(): void {
  if (Date.now() - hourStarted > 3_600_000) {
    hourStarted = Date.now();
    sendsThisHour = 0;
  }
}

async function broadcastToParents(message: string): Promise<{ sent: number; failed: number }> {
  resetHourlyCapIfNeeded();
  const recipients = await listVerifiedParentWhatsAppRecipients();
  let sent = 0;
  let failed = 0;

  for (const r of recipients) {
    if (sendsThisHour >= env.WHATSAPP_MAX_PER_HOUR) {
      logger.warn('WhatsApp: límite por hora alcanzado', { cap: env.WHATSAPP_MAX_PER_HOUR });
      break;
    }
    try {
      await sendWhatsAppText(r.jid, message);
      sent += 1;
      sendsThisHour += 1;
      await delay(env.WHATSAPP_SEND_DELAY_MS);
    } catch (e) {
      failed += 1;
      logger.warn('WhatsApp: no se pudo enviar', { jid: r.jid, label: r.label, err: e });
    }
  }

  return { sent, failed };
}

export class WhatsAppService {
  static async startup(): Promise<void> {
    await initWhatsAppClient();
  }

  static async shutdown(): Promise<void> {
    const { shutdownWhatsAppClient } = await import('./whatsapp.client');
    await shutdownWhatsAppClient();
  }

  static getStatus() {
    return getWhatsAppStatus();
  }

  static async getQrDataUrl(): Promise<string | null> {
    const { qr } = getWhatsAppStatus();
    if (!qr) return null;
    return QRCode.toDataURL(qr, { margin: 1, width: 280 });
  }

  static async reconnect(): Promise<void> {
    await restartWhatsAppClient();
  }

  static async countEligibleRecipients(): Promise<number> {
    const list = await listVerifiedParentWhatsAppRecipients();
    return list.length;
  }

  static async sendTestMessage(): Promise<{
    sent: number;
    failed: number;
    sentTo?: { name: string; phone: string; phoneSource: string };
  }> {
    const recipients = await listVerifiedParentWhatsAppRecipients();
    if (recipients.length === 0) {
      throw new Error('No hay padres verificados con WhatsApp activado y teléfono válido.');
    }
    const r = recipients[0];
    const botJid = getConnectedWhatsAppJid();
    if (botJid && r.jid === botJid) {
      throw new BadRequestError(
        `El teléfono del padre (${formatPhoneForDisplay(r.phoneRaw)}) es el mismo con el que vinculaste el WhatsApp del club. ` +
          'En Mi perfil pon el celular donde quieres recibir avisos; el QR del panel debe escanearse solo con el chip del club.',
      );
    }

    await sendWhatsAppText(
      r.jid,
      '🏟️ *Barcelona Cupido*\n\nMensaje de prueba del sistema de avisos. Si lo recibiste, la conexión funciona.',
    );
    return {
      sent: 1,
      failed: 0,
      sentTo: {
        name: r.label,
        phone: formatPhoneForDisplay(r.phoneRaw),
        phoneSource: r.phoneSource,
      },
    };
  }

  static async notifyNoticePublished(notice: {
    id: string;
    title: string;
    content: string;
    type: string;
  }): Promise<void> {
    if (!env.WHATSAPP_ENABLED) return;
    if (!NOTICE_TYPES_WITH_WHATSAPP.has(notice.type)) return;

    const origin = publicAppOrigin();
    const url = origin ? `${origin}/avisos/${notice.id}` : `/avisos/${notice.id}`;
    const body = truncate(notice.content, 180);
    const message = `🏟️ *F.C. Barcelona Cupido*\n\n📢 *${notice.title}*\n${body}\n\n${url}`;

    const { sent, failed } = await broadcastToParents(message);
    logger.info('WhatsApp aviso publicado', { noticeId: notice.id, sent, failed });
  }

  static async notifyMatchScheduled(match: {
    id: string;
    title: string;
    opponent_name: string;
    match_date: string;
    location: string;
    category?: string;
  }): Promise<void> {
    if (!env.WHATSAPP_ENABLED) return;

    const d = new Date(match.match_date);
    const fecha = d.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const hora = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const origin = publicAppOrigin();
    const url = origin ? `${origin}/partidos/${match.id}` : `/partidos/${match.id}`;
    const cat = match.category ? `\nCategoría: ${match.category}` : '';

    const message =
      `⚽ *Próximo partido — Barcelona Cupido*\n\n` +
      `*${match.title}*\n` +
      `vs ${match.opponent_name}${cat}\n` +
      `📅 ${fecha} · ${hora}\n` +
      `📍 ${match.location || 'Por confirmar'}\n\n` +
      url;

    const { sent, failed } = await broadcastToParents(message);
    logger.info('WhatsApp partido programado', { matchId: match.id, sent, failed });
  }
}
