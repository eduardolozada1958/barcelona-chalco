import fs from 'fs';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { env } from '@config/env';
import { logger } from '@shared/utils/logger';

export type WhatsAppConnectionState = 'disabled' | 'connecting' | 'qr' | 'open' | 'closed';

type BaileysModule = typeof import('@whiskeysockets/baileys');

let baileysMod: BaileysModule | null = null;
let sock: import('@whiskeysockets/baileys').WASocket | null = null;
let connectionState: WhatsAppConnectionState = 'disabled';
let lastQr: string | null = null;
let connecting = false;

async function loadBaileys(): Promise<BaileysModule> {
  if (!baileysMod) {
    baileysMod = await import('@whiskeysockets/baileys');
  }
  return baileysMod;
}

function authDir(): string {
  const dir = env.WHATSAPP_AUTH_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getWhatsAppStatus(): {
  enabled: boolean;
  state: WhatsAppConnectionState;
  qr: string | null;
} {
  return {
    enabled: env.WHATSAPP_ENABLED,
    state: connectionState,
    qr: lastQr,
  };
}

async function startSocket(): Promise<void> {
  if (!env.WHATSAPP_ENABLED || connecting) return;
  connecting = true;
  connectionState = 'connecting';
  lastQr = null;

  try {
    const baileys = await loadBaileys();
    const { state, saveCreds } = await baileys.useMultiFileAuthState(authDir());

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

    sock.ev.on('creds.update', saveCreds);

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
        logger.info('WhatsApp: sesión conectada');
      }
      if (connection === 'close') {
        connectionState = 'closed';
        const code = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
        const loggedOut = code === baileys.DisconnectReason.loggedOut;
        if (loggedOut) {
          logger.warn('WhatsApp: sesión cerrada (logout). Vuelve a escanear el QR.');
          lastQr = null;
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
  if (sock) {
    try {
      sock.end(undefined);
    } catch {
      /* ignore */
    }
    sock = null;
  }
  await startSocket();
}

export async function sendWhatsAppText(jid: string, text: string): Promise<void> {
  if (!env.WHATSAPP_ENABLED) {
    throw new Error('WhatsApp no está habilitado');
  }
  if (connectionState !== 'open' || !sock) {
    throw new Error('WhatsApp no está conectado. Escanea el QR en Ajustes → WhatsApp.');
  }
  await sock.sendMessage(jid, { text });
}

export async function shutdownWhatsAppClient(): Promise<void> {
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
