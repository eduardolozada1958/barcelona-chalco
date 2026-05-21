import fs from 'fs';
import os from 'os';
import path from 'path';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { env } from '@config/env';
import { logger } from '@shared/utils/logger';
import {
  clearAuthInSupabase,
  hydrateAuthDirFromSupabase,
  persistAuthDirToSupabase,
} from './whatsapp-auth-store';

export type WhatsAppConnectionState = 'disabled' | 'connecting' | 'qr' | 'open' | 'closed';

type BaileysModule = typeof import('@whiskeysockets/baileys');

let baileysMod: BaileysModule | null = null;
let sock: import('@whiskeysockets/baileys').WASocket | null = null;
let connectionState: WhatsAppConnectionState = 'disabled';
let lastQr: string | null = null;
let connecting = false;
let authDirPath: string | null = null;
let persistTimer: ReturnType<typeof setInterval> | null = null;
let persistDebounce: ReturnType<typeof setTimeout> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
let openedAt: number | null = null;

const MAX_RECONNECT_ATTEMPTS = 10;

/** 440/515: otra conexión con la misma sesión (típico al reconectar muy rápido en Render). */
function isSessionConflictCode(code: number | undefined): boolean {
  return code === 440 || code === 515 || code === 428;
}

async function loadBaileys(): Promise<BaileysModule> {
  if (!baileysMod) {
    baileysMod = await import('@whiskeysockets/baileys');
  }
  return baileysMod;
}

function clearReconnectTimer(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function clearPersistDebounce(): void {
  if (persistDebounce) {
    clearTimeout(persistDebounce);
    persistDebounce = null;
  }
}

async function wipeLocalAuthDir(): Promise<void> {
  const dir = authDirPath ?? path.join(os.tmpdir(), 'barcelona-whatsapp-auth');
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    try {
      if (fs.statSync(p).isFile()) fs.unlinkSync(p);
    } catch {
      /* ignore */
    }
  }
}

async function resolveAuthDir(forceReload = false): Promise<string> {
  if (authDirPath && !forceReload) return authDirPath;

  if (env.WHATSAPP_AUTH_STORAGE === 'disk') {
    const dir = env.WHATSAPP_AUTH_DIR;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    authDirPath = dir;
    return dir;
  }

  const dir = path.join(os.tmpdir(), 'barcelona-whatsapp-auth');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const n = await hydrateAuthDirFromSupabase(dir);
  if (n > 0) {
    logger.info('WhatsApp: sesión restaurada desde Supabase', { files: n });
  }

  authDirPath = dir;
  return dir;
}

async function persistSession(): Promise<void> {
  if (env.WHATSAPP_AUTH_STORAGE !== 'supabase' || !authDirPath) return;
  try {
    await persistAuthDirToSupabase(authDirPath);
  } catch {
    /* log en store */
  }
}

function schedulePersistDebounced(): void {
  if (env.WHATSAPP_AUTH_STORAGE !== 'supabase') return;
  clearPersistDebounce();
  persistDebounce = setTimeout(() => {
    persistDebounce = null;
    void persistSession();
  }, 60_000);
}

function startPersistInterval(): void {
  stopPersistInterval();
  if (env.WHATSAPP_AUTH_STORAGE !== 'supabase') return;
  persistTimer = setInterval(() => {
    void persistSession();
  }, 120_000);
}

function stopPersistInterval(): void {
  if (persistTimer) {
    clearInterval(persistTimer);
    persistTimer = null;
  }
  clearPersistDebounce();
}

function scheduleReconnect(code: number | undefined): void {
  if (reconnectTimer) return;

  reconnectAttempts += 1;
  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
    logger.error(
      'WhatsApp: demasiados reintentos automáticos. En el panel pulsa «Reconectar» o borra sesión en Supabase (whatsapp_auth_files).',
    );
    connectionState = 'closed';
    connecting = false;
    return;
  }

  const delay = isSessionConflictCode(code)
    ? Math.min(60_000 * reconnectAttempts, 180_000)
    : Math.min(15_000 * reconnectAttempts, 90_000);

  logger.warn('WhatsApp: reconexión programada', {
    code,
    attempt: reconnectAttempts,
    delaySec: Math.round(delay / 1000),
    hint: isSessionConflictCode(code)
      ? 'Conflicto de sesión (440): no abras dos QR a la vez; espera antes de Reconectar.'
      : undefined,
  });

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connecting = false;
    void startSocket();
  }, delay);
}

async function closeSocket(): Promise<void> {
  if (!sock) return;
  const s = sock;
  sock = null;
  try {
    s.ev.removeAllListeners('connection.update');
    s.ev.removeAllListeners('creds.update');
    s.end(undefined);
  } catch {
    /* ignore */
  }
  await new Promise((r) => setTimeout(r, 2500));
}

export function getConnectedWhatsAppJid(): string | null {
  return sock?.user?.id ?? null;
}

export function getWhatsAppStatus(): {
  enabled: boolean;
  state: WhatsAppConnectionState;
  qr: string | null;
  authStorage: string;
  reconnectAttempts: number;
} {
  return {
    enabled: env.WHATSAPP_ENABLED,
    state: connectionState,
    qr: lastQr,
    authStorage: env.WHATSAPP_AUTH_STORAGE,
    reconnectAttempts,
  };
}

async function startSocket(): Promise<void> {
  if (!env.WHATSAPP_ENABLED) return;
  if (connecting) return;

  connecting = true;
  clearReconnectTimer();
  connectionState = 'connecting';
  lastQr = null;

  try {
    await closeSocket();

    const baileys = await loadBaileys();
    const dir = await resolveAuthDir();
    const { state, saveCreds } = await baileys.useMultiFileAuthState(dir);

    const saveCredsAndPersist = async () => {
      await saveCreds();
      schedulePersistDebounced();
    };

    sock = baileys.default({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Barcelona Cupido', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    sock.ev.on('creds.update', () => {
      void saveCredsAndPersist();
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        lastQr = qr;
        connectionState = 'qr';
        logger.info('WhatsApp: escanea el QR en el panel de administración');
      }
      if (connection === 'open') {
        lastQr = null;
        connectionState = 'open';
        connecting = false;
        reconnectAttempts = 0;
        openedAt = Date.now();
        startPersistInterval();
        void persistSession();
        logger.info('WhatsApp: sesión conectada', { user: sock?.user?.id });
      }
      if (connection === 'close') {
        connectionState = 'closed';
        stopPersistInterval();
        void persistSession();

        const code = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
        const loggedOut = code === baileys.DisconnectReason.loggedOut;

        if (loggedOut) {
          logger.warn('WhatsApp: sesión cerrada (logout). Generando QR nuevo…');
          lastQr = null;
          reconnectAttempts = 0;
          clearReconnectTimer();
          void (async () => {
            try {
              if (env.WHATSAPP_AUTH_STORAGE === 'supabase') {
                await clearAuthInSupabase();
              }
              await wipeLocalAuthDir();
            } catch (e) {
              logger.warn('WhatsApp: no se pudo limpiar sesión tras logout', { err: e });
            }
            authDirPath = null;
            connecting = false;
            await startSocket();
          })();
        } else {
          scheduleReconnect(code);
        }
      }
    });
  } catch (e) {
    connectionState = 'closed';
    connecting = false;
    logger.error('WhatsApp: error al iniciar', { err: e });
  }
}

export async function initWhatsAppClient(): Promise<void> {
  if (!env.WHATSAPP_ENABLED) {
    connectionState = 'disabled';
    return;
  }
  await startSocket();
}

export async function restartWhatsAppClient(): Promise<void> {
  if (!env.WHATSAPP_ENABLED) return;
  reconnectAttempts = 0;
  clearReconnectTimer();
  stopPersistInterval();
  await closeSocket();
  authDirPath = null;
  connecting = false;
  await startSocket();
}

export async function resetWhatsAppSession(): Promise<void> {
  reconnectAttempts = 0;
  clearReconnectTimer();
  stopPersistInterval();
  await closeSocket();
  if (env.WHATSAPP_AUTH_STORAGE === 'supabase') {
    await clearAuthInSupabase();
  }
  await wipeLocalAuthDir();
  authDirPath = null;
  lastQr = null;
  connecting = false;
  await startSocket();
}

/** Arranca el cliente si quedó en «closed» sin reintentos pendientes (p. ej. tras dormir en Render). */
export async function ensureWhatsAppClientRunning(): Promise<void> {
  if (!env.WHATSAPP_ENABLED) return;
  if (connecting || reconnectTimer) return;
  if (connectionState === 'open' || connectionState === 'qr') return;
  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) return;
  if (connectionState === 'closed') {
    await startSocket();
  }
}

export async function sendWhatsAppText(jid: string, text: string): Promise<void> {
  if (!env.WHATSAPP_ENABLED) {
    throw new Error('WhatsApp no está habilitado');
  }
  if (connectionState !== 'open' || !sock) {
    throw new Error('WhatsApp no está conectado. Espera «Conectado» estable o reconecta.');
  }
  const opened = openedAt ?? 0;
  const waitMs = 3000 - (Date.now() - opened);
  if (waitMs > 0) {
    await new Promise((r) => setTimeout(r, waitMs));
  }
  await sock.sendMessage(jid, { text });
}

export async function shutdownWhatsAppClient(): Promise<void> {
  clearReconnectTimer();
  stopPersistInterval();
  await persistSession();
  await closeSocket();
  connectionState = env.WHATSAPP_ENABLED ? 'closed' : 'disabled';
  connecting = false;
}
