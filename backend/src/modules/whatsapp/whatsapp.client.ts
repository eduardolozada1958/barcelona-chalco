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

async function loadBaileys(): Promise<BaileysModule> {
  if (!baileysMod) {
    baileysMod = await import('@whiskeysockets/baileys');
  }
  return baileysMod;
}

async function resolveAuthDir(): Promise<string> {
  if (authDirPath) return authDirPath;

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

function startPersistInterval(): void {
  stopPersistInterval();
  if (env.WHATSAPP_AUTH_STORAGE !== 'supabase') return;
  persistTimer = setInterval(() => {
    void persistSession();
  }, 45_000);
}

function stopPersistInterval(): void {
  if (persistTimer) {
    clearInterval(persistTimer);
    persistTimer = null;
  }
}

export function getWhatsAppStatus(): {
  enabled: boolean;
  state: WhatsAppConnectionState;
  qr: string | null;
  authStorage: string;
} {
  return {
    enabled: env.WHATSAPP_ENABLED,
    state: connectionState,
    qr: lastQr,
    authStorage: env.WHATSAPP_AUTH_STORAGE,
  };
}

async function startSocket(): Promise<void> {
  if (!env.WHATSAPP_ENABLED || connecting) return;
  connecting = true;
  connectionState = 'connecting';
  lastQr = null;

  try {
    const baileys = await loadBaileys();
    const dir = await resolveAuthDir();
    const { state, saveCreds } = await baileys.useMultiFileAuthState(dir);

    const saveCredsAndPersist = async () => {
      await saveCreds();
      await persistSession();
    };

    if (sock) {
      try {
        sock.end(undefined);
      } catch {
        /* ignore */
      }
      sock = null;
    }

    sock = baileys.default({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Barcelona Cupido', 'Chrome', '1.0.0'],
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
        startPersistInterval();
        void persistSession();
        logger.info('WhatsApp: sesión conectada');
      }
      if (connection === 'close') {
        connectionState = 'closed';
        stopPersistInterval();
        void persistSession();

        const code = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
        const loggedOut = code === baileys.DisconnectReason.loggedOut;
        if (loggedOut) {
          logger.warn('WhatsApp: sesión cerrada (logout). Vuelve a escanear el QR.');
          lastQr = null;
          if (env.WHATSAPP_AUTH_STORAGE === 'supabase') {
            void clearAuthInSupabase().catch(() => undefined);
          }
          authDirPath = null;
        } else {
          logger.warn('WhatsApp: conexión cerrada, reintentando…', { code });
          setTimeout(() => {
            connecting = false;
            void startSocket();
          }, 5000);
        }
      }
    });
  } catch (e) {
    connectionState = 'closed';
    logger.error('WhatsApp: error al iniciar', { err: e });
  } finally {
    connecting = false;
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
  connecting = false;
  stopPersistInterval();
  if (sock) {
    try {
      sock.end(undefined);
    } catch {
      /* ignore */
    }
    sock = null;
  }
  authDirPath = null;
  await startSocket();
}

export async function sendWhatsAppText(jid: string, text: string): Promise<void> {
  if (!env.WHATSAPP_ENABLED) {
    throw new Error('WhatsApp no está habilitado');
  }
  if (connectionState !== 'open' || !sock) {
    throw new Error('WhatsApp no está conectado. Escanea el QR en el panel → WhatsApp.');
  }
  await sock.sendMessage(jid, { text });
}

export async function shutdownWhatsAppClient(): Promise<void> {
  stopPersistInterval();
  await persistSession();
  if (sock) {
    try {
      sock.end(undefined);
    } catch {
      /* ignore */
    }
    sock = null;
  }
  connectionState = env.WHATSAPP_ENABLED ? 'closed' : 'disabled';
}
