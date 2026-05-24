import QRCode from 'qrcode';
import { env } from '@config/env';
import { BadRequestError } from '@middlewares/error.middleware';
import { logger } from '@shared/utils/logger';
import { formatClubDate, formatClubDateTime, formatClubTime } from '@shared/utils/club-datetime';
import { PlayersService } from '@modules/players/players.service';
import { NOTICE_TYPES_WITH_WHATSAPP } from './whatsapp.constants';
import { formatPhoneForDisplay, normalizePhoneDigits } from './phone';
import {
  ensureWhatsAppClientRunning,
  getConnectedWhatsAppJid,
  getWhatsAppStatus,
  initWhatsAppClient,
  resetWhatsAppSession,
  sendWhatsAppText,
} from './whatsapp.client';
import { jidToPhoneDigits } from './whatsapp-delivery';
import { getWhatsAppRecipientDiagnostics, listVerifiedParentWhatsAppRecipients } from './whatsapp.recipients';

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

const BROADCAST_CONNECT_WAIT_MS = 60_000;
const BROADCAST_CONNECT_POLL_MS = 1_000;
const BROADCAST_RETRY_WAIT_MS = 5_000;

function resetHourlyCapIfNeeded(): void {
  if (Date.now() - hourStarted > 3_600_000) {
    hourStarted = Date.now();
    sendsThisHour = 0;
  }
}

async function assertReadyForBroadcast(): Promise<void> {
  if (!env.WHATSAPP_ENABLED) {
    throw new Error('WhatsApp no está habilitado en el servidor.');
  }
  await ensureWhatsAppClientRunning();
  const deadline = Date.now() + BROADCAST_CONNECT_WAIT_MS;
  while (Date.now() < deadline) {
    const state = getWhatsAppStatus().state;
    if (state === 'open') return;
    if (state === 'qr') {
      throw new Error('WhatsApp esperando QR. Escanea el código en el panel de administración.');
    }
    await delay(BROADCAST_CONNECT_POLL_MS);
  }
  throw new Error('WhatsApp no está conectado. Abre el panel de administración y escanea el QR.');
}

async function broadcastToParents(message: string): Promise<{ sent: number; failed: number; total: number; skippedCap: number }> {
  resetHourlyCapIfNeeded();

  try {
    await assertReadyForBroadcast();
  } catch (firstErr) {
    logger.warn('WhatsApp: conexión no lista; reintento en 5 s', { err: firstErr });
    await delay(BROADCAST_RETRY_WAIT_MS);
    await assertReadyForBroadcast();
  }

  const recipients = await listVerifiedParentWhatsAppRecipients();
  const total = recipients.length;
  let sent = 0;
  let failed = 0;
  let skippedCap = 0;

  if (total === 0) {
    const diag = await getWhatsAppRecipientDiagnostics();
    logger.warn('WhatsApp: broadcast sin padres elegibles', diag);
    return { sent: 0, failed: 0, total: 0, skippedCap: 0 };
  }

  const botJid = getConnectedWhatsAppJid();
  const botDigits = jidToPhoneDigits(botJid);

  for (const r of recipients) {
    if (sendsThisHour >= env.WHATSAPP_MAX_PER_HOUR) {
      skippedCap = total - sent - failed;
      logger.warn('WhatsApp: límite por hora alcanzado', {
        cap: env.WHATSAPP_MAX_PER_HOUR,
        sent,
        failed,
        skippedCap,
      });
      break;
    }
    const destDigits = normalizePhoneDigits(r.phoneRaw);
    if (botDigits && destDigits && botDigits === destDigits) {
      failed += 1;
      logger.warn('WhatsApp: teléfono del padre coincide con el chip del club; omitido', {
        label: r.label,
        phone: formatPhoneForDisplay(r.phoneRaw),
      });
      continue;
    }
    try {
      await sendWhatsAppText(r.jid, message, r.phoneRaw, { lenientVerify: true });
      sent += 1;
      sendsThisHour += 1;
      await delay(env.WHATSAPP_SEND_DELAY_MS);
    } catch (e) {
      failed += 1;
      logger.warn('WhatsApp: no se pudo enviar', { jid: r.jid, label: r.label, err: e });
    }
  }

  logger.info('WhatsApp: broadcast a todos los elegibles', { sent, failed, total, skippedCap });
  return { sent, failed, total, skippedCap };
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
    const { qr } = WhatsAppService.getStatus();
    if (!qr) return null;
    return QRCode.toDataURL(qr, { margin: 1, width: 280 });
  }

  static async reconnect(): Promise<void> {
    await resetWhatsAppSession();
  }

  static async resetSession(): Promise<void> {
    await resetWhatsAppSession();
  }

  static async countEligibleRecipients(): Promise<number> {
    const list = await listVerifiedParentWhatsAppRecipients();
    return list.length;
  }

  static async getRecipientDiagnostics() {
    return getWhatsAppRecipientDiagnostics();
  }

  static async sendTestMessage(): Promise<{
    sent: number;
    failed: number;
    sentTo?: {
      name: string;
      phone: string;
      phoneSource: string;
      deliveredJid?: string;
      messageId?: string;
    };
  }> {
    const recipients = await listVerifiedParentWhatsAppRecipients();
    if (recipients.length === 0) {
      throw new Error('No hay padres verificados con WhatsApp activado y teléfono válido.');
    }
    const r = recipients[0];
    const botJid = getConnectedWhatsAppJid();
    const botDigits = jidToPhoneDigits(botJid);
    const destDigits = normalizePhoneDigits(r.phoneRaw);
    if (botDigits && destDigits && botDigits === destDigits) {
      throw new BadRequestError(
        `El teléfono del padre (${formatPhoneForDisplay(r.phoneRaw)}) es el mismo con el que vinculaste el WhatsApp del club. ` +
          'En Mi perfil pon el celular donde quieres recibir avisos; el QR del panel debe escanearse solo con el chip del club.',
      );
    }

    const { jid: deliveredJid, messageId } = await sendWhatsAppText(
      r.jid,
      '🏟️ *Barcelona Cupido*\n\nMensaje de prueba del sistema de avisos. Si lo recibiste, la conexión funciona.',
      r.phoneRaw,
      { lenientVerify: true },
    );
    return {
      sent: 1,
      failed: 0,
      sentTo: {
        name: r.label,
        phone: formatPhoneForDisplay(r.phoneRaw),
        phoneSource: r.phoneSource,
        deliveredJid,
        messageId,
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
    if (!env.WHATSAPP_ENABLED || !env.WHATSAPP_NOTIFY_MATCHES) return;

    logger.info('WhatsApp: enviando aviso de partido programado', { matchId: match.id, title: match.title });

    const fecha = formatClubDate(match.match_date);
    const hora = formatClubTime(match.match_date);
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

  static async notifyMatchUpdated(match: {
    id: string;
    title: string;
    opponent_name: string;
    match_date: string;
    location: string;
    category?: string;
  }): Promise<void> {
    if (!env.WHATSAPP_ENABLED || !env.WHATSAPP_NOTIFY_MATCHES) return;

    const fecha = formatClubDate(match.match_date);
    const hora = formatClubTime(match.match_date);
    const origin = publicAppOrigin();
    const url = origin ? `${origin}/partidos/${match.id}` : `/partidos/${match.id}`;
    const cat = match.category ? `\nCategoría: ${match.category}` : '';

    const message =
      `⚽ *Partido actualizado — Barcelona Cupido*\n\n` +
      `*${match.title}*\n` +
      `vs ${match.opponent_name}${cat}\n` +
      `📅 ${fecha} · ${hora}\n` +
      `📍 ${match.location || 'Por confirmar'}\n\n` +
      url;

    const { sent, failed } = await broadcastToParents(message);
    logger.info('WhatsApp partido actualizado', { matchId: match.id, sent, failed });
  }

  static async notifyResultPublished(result: {
    id: string;
    goals_scored: number;
    goals_conceded: number;
    match_title?: string;
    opponent_name?: string;
    match_date?: string;
  }): Promise<void> {
    if (!env.WHATSAPP_ENABLED || !env.WHATSAPP_NOTIFY_RESULTS) return;

    const origin = publicAppOrigin();
    const url = origin ? `${origin}/resultados` : '/resultados';
    const rival = result.opponent_name?.trim() || 'rival';
    const titulo = result.match_title?.trim() || 'Partido';
    const marcador = `${result.goals_scored} - ${result.goals_conceded}`;
    const cuando = result.match_date ? `\n📅 ${formatClubDateTime(result.match_date)}` : '';

    const message =
      `🏟️ *Resultado publicado — Barcelona Cupido*\n\n` +
      `*${titulo}* vs ${rival}\n` +
      `⚽ Marcador: *${marcador}*${cuando}\n\n` +
      url;

    const { sent, failed } = await broadcastToParents(message);
    logger.info('WhatsApp resultado publicado', { resultId: result.id, sent, failed });

    if (env.WHATSAPP_NOTIFY_LEADERS) {
      void WhatsAppService.notifySeasonLeadersUpdate().catch((e) =>
        logger.warn('WhatsApp: falló aviso de tabla de goleo', { err: e }),
      );
    }
  }

  /** Top goleadores (tabla de goleo) tras publicar un resultado. */
  static async notifySeasonLeadersUpdate(): Promise<void> {
    if (!env.WHATSAPP_ENABLED || !env.WHATSAPP_NOTIFY_LEADERS) return;

    const leaders = await PlayersService.publicSeasonLeaders(5);
    const top = leaders.scoring.slice(0, 5);
    if (top.length === 0) return;

    const lines = top.map(
      (r, i) =>
        `${i + 1}. ${r.first_name} ${r.last_name} — ${r.goals} gol${r.goals === 1 ? '' : 'es'}${
          r.assists > 0 ? `, ${r.assists} asist.` : ''
        }`,
    );

    const origin = publicAppOrigin();
    const url = origin ? `${origin}/` : '/';

    const message =
      `🏟️ *Tabla de goleo — Barcelona Cupido*\n\n` +
      `${lines.join('\n')}\n\n` +
      `Ver más en el sitio:\n${url}`;

    const { sent, failed } = await broadcastToParents(message);
    logger.info('WhatsApp tabla goleo', { sent, failed });
  }

  static async notifyMvpSet(payload: {
    playerName: string;
    weekLabel?: string | null;
  }): Promise<void> {
    if (!env.WHATSAPP_ENABLED || !env.WHATSAPP_NOTIFY_MVP) return;

    const origin = publicAppOrigin();
    const url = origin ? `${origin}/` : '/';
    const semana = payload.weekLabel?.trim() ? `\n📆 ${payload.weekLabel.trim()}` : '';

    const message =
      `🏟️ *MVP de la semana — Barcelona Cupido*\n\n` +
      `⭐ *${payload.playerName}*${semana}\n\n` +
      url;

    const { sent, failed, total } = await broadcastToParents(message);
    logger.info('WhatsApp MVP', { sent, failed, total });
  }

  static async notifyGalleryPublished(post: {
    id: string;
    title: string;
    description?: string | null;
  }): Promise<void> {
    if (!env.WHATSAPP_ENABLED || !env.WHATSAPP_NOTIFY_GALLERY) return;

    const origin = publicAppOrigin();
    const url = origin ? `${origin}/galeria/${post.id}` : `/galeria/${post.id}`;
    const body = truncate(post.description ?? '', 120);

    const message =
      `🏟️ *Nueva galería — Barcelona Cupido*\n\n` +
      `📸 *${post.title}*\n` +
      (body ? `${body}\n\n` : '\n') +
      url;

    const { sent, failed } = await broadcastToParents(message);
    logger.info('WhatsApp galería', { postId: post.id, sent, failed });
  }
}
