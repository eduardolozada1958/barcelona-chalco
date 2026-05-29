import { createHash } from 'node:crypto';

/** Ventana anti-duplicados por destino + campaña (mismo proceso Render). */
const DEDUP_MS_BY_KIND: Record<string, number> = {
  'notice':           2 * 60_000,
  'match:scheduled':  30 * 60_000,
  'match:updated':    30 * 60_000,
  'result':           60 * 60_000,
  'leaders':          60 * 60_000,
  'mvp':              24 * 60 * 60_000,
  'gallery':          15 * 60_000,
  'remind:curp':      24 * 60 * 60_000,
};

const sentAt = new Map<string, number>();

function dedupKey(jid: string, kind: string, id?: string): string {
  return `${jid}:${kind}:${id ?? ''}`;
}

export function shouldSkipWhatsAppSend(jid: string, kind: string, id?: string): boolean {
  const key = dedupKey(jid, kind, id);
  const last = sentAt.get(key);
  const windowMs = DEDUP_MS_BY_KIND[kind] ?? 10 * 60_000;
  return last != null && Date.now() - last < windowMs;
}

export function markWhatsAppSent(jid: string, kind: string, id?: string): void {
  sentAt.set(dedupKey(jid, kind, id), Date.now());
  if (sentAt.size > 5000) {
    const cutoff = Date.now() - 24 * 60 * 60_000;
    for (const [k, t] of sentAt) {
      if (t < cutoff) sentAt.delete(k);
    }
  }
}

/** Evita reenviar el mismo texto aunque cambie el id de campaña. */
export function shouldSkipWhatsAppByBody(jid: string, body: string): boolean {
  const hash = createHash('sha256').update(body).digest('hex').slice(0, 16);
  const key = `${jid}:body:${hash}`;
  const last = sentAt.get(key);
  const windowMs = 5 * 60_000;
  return last != null && Date.now() - last < windowMs;
}

export function markWhatsAppBodySent(jid: string, body: string): void {
  const hash = createHash('sha256').update(body).digest('hex').slice(0, 16);
  sentAt.set(`${jid}:body:${hash}`, Date.now());
}
