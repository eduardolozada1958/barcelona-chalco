import webpush from 'web-push';
import { supabaseAdmin } from '@config/database';
import { env } from '@config/env';
import { logger } from '@shared/utils/logger';
import { NOTICE_TYPES_WITH_PUSH } from './push.constants';
import type { SubscribePushBody } from './push.validation';

function publicAppOrigin(): string {
  const raw = env.APP_PUBLIC_URL ?? env.CORS_ORIGIN.split(',')[0]?.trim() ?? '';
  return raw.replace(/\/$/, '');
}

function truncateBody(text: string, max = 140): string {
  const plain = text.replace(/\s+/g, ' ').trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1)}…`;
}

function isVapidConfigured(): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
}

function ensureWebPush(): boolean {
  if (!isVapidConfigured()) return false;
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY!,
    env.VAPID_PRIVATE_KEY!,
  );
  return true;
}

export class PushService {
  static getPublicKey(): string | null {
    return env.VAPID_PUBLIC_KEY ?? null;
  }

  static async subscribe(input: SubscribePushBody, userAgent?: string) {
    const { error } = await supabaseAdmin.from('push_subscriptions').upsert(
      {
        endpoint:   input.endpoint,
        p256dh:     input.keys.p256dh,
        auth:       input.keys.auth,
        user_agent: userAgent ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' },
    );
    if (error) throw new Error(error.message);
  }

  static async unsubscribe(endpoint: string) {
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);
    if (error) throw new Error(error.message);
  }

  static async notifyNoticePublished(notice: {
    id: string;
    title: string;
    content: string;
    type: string;
  }): Promise<void> {
    if (!NOTICE_TYPES_WITH_PUSH.has(notice.type)) return;
    if (!ensureWebPush()) {
      logger.debug('Web Push omitido: VAPID no configurado');
      return;
    }

    const origin = publicAppOrigin();
    const url = origin ? `${origin}/avisos/${notice.id}` : `/avisos/${notice.id}`;
    const payload = JSON.stringify({
      title: notice.title,
      body:  truncateBody(notice.content),
      url,
      type:  notice.type,
    });

    const { data: rows, error } = await supabaseAdmin.from('push_subscriptions').select('endpoint, p256dh, auth');
    if (error) throw new Error(error.message);
    if (!rows?.length) return;

    const stale: string[] = [];

    await Promise.all(
      rows.map(async (row) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: row.endpoint,
              keys: { p256dh: row.p256dh, auth: row.auth },
            },
            payload,
          );
        } catch (e: unknown) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            stale.push(row.endpoint);
            return;
          }
          logger.warn('Push fallido para un dispositivo', { endpoint: row.endpoint, status });
        }
      }),
    );

    if (stale.length > 0) {
      await supabaseAdmin.from('push_subscriptions').delete().in('endpoint', stale);
    }

    logger.info(`Push aviso enviado a ${rows.length - stale.length} dispositivo(s)`, { noticeId: notice.id });
  }
}
