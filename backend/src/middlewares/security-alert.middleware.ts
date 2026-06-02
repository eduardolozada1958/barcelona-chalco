import { Request, Response, NextFunction } from 'express';
import { env } from '@config/env';
import { logger } from '@shared/utils/logger';

type AlertKind = '401' | '429';

let windowStartMs = Date.now();
let count401 = 0;
let count429 = 0;
const lastFiredAt: Record<AlertKind, number> = { '401': 0, '429': 0 };

function resetWindowIfNeeded(now: number): void {
  if (now - windowStartMs >= env.SECURITY_ALERT_WINDOW_MS) {
    windowStartMs = now;
    count401 = 0;
    count429 = 0;
  }
}

async function sendWebhook(payload: Record<string, unknown>): Promise<void> {
  const url = env.SECURITY_ALERT_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
  } catch (err) {
    logger.warn('security_alert_webhook_failed', { err });
  }
}

function maybeAlert(kind: AlertKind, count: number, threshold: number, now: number): void {
  if (count < threshold) return;
  if (now - lastFiredAt[kind] < env.SECURITY_ALERT_COOLDOWN_MS) return;

  lastFiredAt[kind] = now;
  const detail = {
    kind,
    count,
    threshold,
    windowMs: env.SECURITY_ALERT_WINDOW_MS,
    at:       new Date(now).toISOString(),
  };

  logger.error('security_alert', {
    message: `Pico de respuestas ${kind}: ${count} en ${env.SECURITY_ALERT_WINDOW_MS / 1000}s (umbral ${threshold})`,
    ...detail,
  });

  void sendWebhook({
    text: `[Barcelona API] Alerta ${kind}: ${count} respuestas en ${Math.round(env.SECURITY_ALERT_WINDOW_MS / 60000)} min (umbral ${threshold}). Revisar logs Render.`,
    ...detail,
  });
}

export function securityAlertMiddleware(_req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    const now = Date.now();
    resetWindowIfNeeded(now);

    if (res.statusCode === 401) count401 += 1;
    if (res.statusCode === 429) count429 += 1;

    maybeAlert('401', count401, env.SECURITY_ALERT_401_THRESHOLD, now);
    maybeAlert('429', count429, env.SECURITY_ALERT_429_THRESHOLD, now);
  });

  next();
}

/** Expuesto para tests. */
export function _resetSecurityAlertStateForTests(): void {
  windowStartMs = Date.now();
  count401 = 0;
  count429 = 0;
  lastFiredAt['401'] = 0;
  lastFiredAt['429'] = 0;
}
