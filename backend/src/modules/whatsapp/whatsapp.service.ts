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
import {
  markWhatsAppBodySent,
  markWhatsAppSent,
  shouldSkipWhatsAppByBody,
  shouldSkipWhatsAppSend,
} from './whatsapp-dedup';
import { listAllParentWhatsAppCandidates } from './whatsapp-audit.candidates';
import { WhatsAppAuditService } from './whatsapp-audit.service';
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

async function broadcastToParents(
  message: string,
  campaign: { kind: string; id?: string; title: string },
): Promise<{ sent: number; failed: number; total: number; skippedCap: number; skippedDup: number; batchId: string | null }> {
  resetHourlyCapIfNeeded();

  const candidates = await listAllParentWhatsAppCandidates();
  let batchId: string | null = null;

  try {
    batchId = await WhatsAppAuditService.createBatch({
      kind:           campaign.kind,
      referenceId:    campaign.id ?? null,
      title:          campaign.title,
      messagePreview: message,
    });
  } catch (e) {
    logger.warn('WhatsApp: no se pudo crear lote de auditoría', { err: e });
  }

  const flushAudit = async (
    logs: Parameters<typeof WhatsAppAuditService.appendLogs>[1],
    counts: { sent: number; failed: number; skipped: number },
  ) => {
    if (!batchId) return;
    try {
      await WhatsAppAuditService.appendLogs(batchId, logs);
      await WhatsAppAuditService.finishBatch(batchId, counts);
    } catch (e) {
      logger.warn('WhatsApp: falló guardar auditoría', { err: e });
    }
  };

  let waReady = true;
  try {
    await assertReadyForBroadcast();
  } catch (firstErr) {
    logger.warn('WhatsApp: conexión no lista; reintento en 5 s', { err: firstErr });
    try {
      await delay(BROADCAST_RETRY_WAIT_MS);
      await assertReadyForBroadcast();
    } catch {
      waReady = false;
    }
  }

  if (!waReady) {
    const logs = candidates.map((c) =>
      WhatsAppAuditService.logRowFromCandidate(c, 'skipped', 'wa_not_connected'),
    );
    await flushAudit(logs, { sent: 0, failed: 0, skipped: logs.length });
    return { sent: 0, failed: 0, total: candidates.length, skippedCap: 0, skippedDup: 0, batchId };
  }

  const botJid = getConnectedWhatsAppJid();
  const botDigits = jidToPhoneDigits(botJid);
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let skippedDup = 0;
  let skippedCap = 0;
  let capReached = false;
  const auditLogs: Parameters<typeof WhatsAppAuditService.appendLogs>[1] = [];

  for (const c of candidates) {
    if (!c.clubBroadcastEligible) {
      skipped += 1;
      auditLogs.push(
        WhatsAppAuditService.logRowFromCandidate(c, 'skipped', c.ineligibleReason ?? 'no_approved_child'),
      );
      continue;
    }

    if (capReached) {
      skipped += 1;
      skippedCap += 1;
      auditLogs.push(WhatsAppAuditService.logRowFromCandidate(c, 'skipped', 'hourly_cap'));
      continue;
    }

    if (!c.jid) {
      skipped += 1;
      auditLogs.push(WhatsAppAuditService.logRowFromCandidate(c, 'skipped', 'no_phone'));
      continue;
    }

    if (shouldSkipWhatsAppSend(c.jid, campaign.kind, campaign.id)) {
      skipped += 1;
      skippedDup += 1;
      auditLogs.push(WhatsAppAuditService.logRowFromCandidate(c, 'skipped', 'dedup_campaign'));
      continue;
    }
    if (shouldSkipWhatsAppByBody(c.jid, message)) {
      skipped += 1;
      skippedDup += 1;
      auditLogs.push(WhatsAppAuditService.logRowFromCandidate(c, 'skipped', 'dedup_body'));
      continue;
    }

    const destDigits = normalizePhoneDigits(c.phoneRaw);
    if (botDigits && destDigits && botDigits === destDigits) {
      failed += 1;
      auditLogs.push(
        WhatsAppAuditService.logRowFromCandidate(c, 'failed', 'same_as_club_number', 'Teléfono igual al chip del club'),
      );
      continue;
    }

    if (sendsThisHour >= env.WHATSAPP_MAX_PER_HOUR) {
      capReached = true;
      skipped += 1;
      skippedCap += 1;
      auditLogs.push(WhatsAppAuditService.logRowFromCandidate(c, 'skipped', 'hourly_cap'));
      continue;
    }

    try {
      await sendWhatsAppText(c.jid, message, c.phoneRaw, { lenientVerify: true });
      markWhatsAppSent(c.jid, campaign.kind, campaign.id);
      markWhatsAppBodySent(c.jid, message);
      sent += 1;
      sendsThisHour += 1;
      auditLogs.push(WhatsAppAuditService.logRowFromCandidate(c, 'sent', null));
      await delay(env.WHATSAPP_SEND_DELAY_MS);
    } catch (e) {
      failed += 1;
      const errMsg = e instanceof Error ? e.message : String(e);
      auditLogs.push(WhatsAppAuditService.logRowFromCandidate(c, 'failed', 'send_failed', errMsg));
      logger.warn('WhatsApp: no se pudo enviar', { jid: c.jid, name: c.name, err: e });
    }
  }

  await flushAudit(auditLogs, { sent, failed, skipped });

  if (sent === 0 && candidates.length > 0) {
    const diag = await getWhatsAppRecipientDiagnostics();
    logger.warn('WhatsApp: broadcast sin envíos exitosos', diag);
  }

  logger.info('WhatsApp: broadcast registrado', {
    sent,
    failed,
    skipped,
    skippedCap,
    skippedDup,
    campaign: campaign.kind,
    campaignId: campaign.id,
    batchId,
  });
  return { sent, failed, total: candidates.length, skippedCap, skippedDup, batchId };
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
    batchId: string | null;
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

    const testMessage =
      '🏟️ *Barcelona Cupido*\n\nMensaje de prueba del sistema de avisos. Si lo recibiste, la conexión funciona.';

    const { jid: deliveredJid, messageId } = await sendWhatsAppText(
      r.jid,
      testMessage,
      r.phoneRaw,
      { lenientVerify: true },
    );

    const candidates = await listAllParentWhatsAppCandidates();
    let batchId: string | null = null;
    try {
      batchId = await WhatsAppAuditService.createBatch({
        kind:           'test',
        title:          'Mensaje de prueba',
        messagePreview: testMessage,
      });
      const logs = candidates.map((c) => {
        if (c.parentId === r.parentId) {
          return WhatsAppAuditService.logRowFromCandidate(c, 'sent', null);
        }
        return WhatsAppAuditService.logRowFromCandidate(c, 'skipped', 'not_in_audience');
      });
      const sentCount = logs.filter((l) => l.outcome === 'sent').length;
      await WhatsAppAuditService.appendLogs(batchId, logs);
      await WhatsAppAuditService.finishBatch(batchId, {
        sent:    sentCount,
        failed:  0,
        skipped: logs.length - sentCount,
      });
    } catch (e) {
      logger.warn('WhatsApp: auditoría de prueba no guardada', { err: e });
    }

    return {
      sent: 1,
      failed: 0,
      batchId,
      sentTo: {
        name: r.label,
        phone: formatPhoneForDisplay(r.phoneRaw),
        phoneSource: r.phoneSource,
        deliveredJid,
        messageId,
      },
    };
  }

  static listDeliveryBatches(opts: { page: number; limit: number }) {
    return WhatsAppAuditService.listBatches(opts);
  }

  static getDeliveryBatchDetail(batchId: string) {
    return WhatsAppAuditService.getBatchDetail(batchId);
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

    const { sent, failed, skippedDup } = await broadcastToParents(message, {
      kind: 'notice',
      id: notice.id,
      title: `Aviso: ${notice.title}`,
    });
    logger.info('WhatsApp aviso publicado', { noticeId: notice.id, sent, failed, skippedDup });
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

    const { sent, failed, skippedDup } = await broadcastToParents(message, {
      kind: 'match:scheduled',
      id: match.id,
      title: `Partido: ${match.title}`,
    });
    logger.info('WhatsApp partido programado', { matchId: match.id, sent, failed, skippedDup });
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

    const { sent, failed, skippedDup } = await broadcastToParents(message, {
      kind: 'match:updated',
      id: match.id,
      title: `Partido actualizado: ${match.title}`,
    });
    logger.info('WhatsApp partido actualizado', { matchId: match.id, sent, failed, skippedDup });
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

    let leadersBlock = '';
    if (env.WHATSAPP_NOTIFY_LEADERS) {
      const leaders = await PlayersService.publicSeasonLeaders(5);
      const top = leaders.scoring.slice(0, 5);
      if (top.length > 0) {
        const lines = top.map(
          (r, i) =>
            `${i + 1}. ${r.first_name} ${r.last_name} — ${r.goals} gol${r.goals === 1 ? '' : 'es'}${
              r.assists > 0 ? `, ${r.assists} asist.` : ''
            }`,
        );
        leadersBlock =
          `\n\n🏆 *Top goleo*\n` +
          `${lines.join('\n')}`;
      }
    }

    const message =
      `🏟️ *Resultado publicado — Barcelona Cupido*\n\n` +
      `*${titulo}* vs ${rival}\n` +
      `⚽ Marcador: *${marcador}*${cuando}` +
      leadersBlock +
      `\n\n${url}`;

    const { sent, failed, skippedDup } = await broadcastToParents(message, {
      kind: 'result',
      id: result.id,
      title: `Resultado: ${titulo} vs ${rival}`,
    });
    logger.info('WhatsApp resultado publicado', { resultId: result.id, sent, failed, skippedDup });
  }

  /** Top goleadores (tabla de goleo) — solo si se invoca aparte; al publicar resultado va en el mismo mensaje. */
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

    const { sent, failed, skippedDup } = await broadcastToParents(message, {
      kind: 'leaders',
      title: 'Tabla de goleo',
    });
    logger.info('WhatsApp tabla goleo', { sent, failed, skippedDup });
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

    const { sent, failed, total, skippedDup } = await broadcastToParents(message, {
      kind: 'mvp',
      title: `MVP: ${payload.playerName}`,
    });
    logger.info('WhatsApp MVP', { sent, failed, total, skippedDup });
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

    const { sent, failed, skippedDup } = await broadcastToParents(message, {
      kind: 'gallery',
      id: post.id,
      title: `Galería: ${post.title}`,
    });
    logger.info('WhatsApp galería', { postId: post.id, sent, failed, skippedDup });
  }
}
