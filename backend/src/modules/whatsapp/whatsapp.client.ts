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
let logoutRecoveryTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
let openedAt: number | null = null;
let socketGeneration = 0;
let sessionResetInProgress = false;
let startSocketChain: Promise<void> = Promise.resolve();

const MAX_RECONNECT_ATTEMPTS = 10;
const LOGOUT_RECOVERY_DELAY_MS = 10_000;
const PAIRING_RETRY_DELAY_MS = 15_000;
const SOCKET_CLOSE_WAIT_MS = 4_000;

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

function clearLogoutRecoveryTimer(): void {
  if (logoutRecoveryTimer) {
    clearTimeout(logoutRecoveryTimer);
    logoutRecoveryTimer = null;
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

async function clearStoredSession(): Promise<void> {
  stopPersistInterval();
  if (env.WHATSAPP_AUTH_STORAGE === 'supabase') {
    await clearAuthInSupabase();
  }
  await wipeLocalAuthDir();
  authDirPath = null;
  openedAt = null;
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
  if (connectionState !== 'open') return;
  if (env.WHATSAPP_AUTH_STORAGE !== 'supabase' || !authDirPath) return;
  try {
    await persistAuthDirToSupabase(authDirPath);
  } catch {
    /* log en store */
  }
}

function schedulePersistDebounced(): void {
  if (connectionState !== 'open') return;
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

function queueStartSocket(delayMs = 0): void {
  startSocketChain = startSocketChain
    .then(async () => {
      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
      await startSocketInternal();
    })
    .catch((e) => {
      logger.error('WhatsApp: error en cola de inicio', { err: e });
    });
}

function scheduleReconnect(code: number | undefined): void {
  if (reconnectTimer || sessionResetInProgress || logoutRecoveryTimer) return;

  reconnectAttempts += 1;
  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
    logger.error(
      'WhatsApp: demasiados reintentos automáticos. Pulsa «Nuevo QR» en el panel.',
    );
    connectionState = 'closed';
    connecting = false;
    lastQr = null;
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
      ? 'Conflicto de sesión: cierra otros dispositivos vinculados en el teléfono del club y espera antes de escanear.'
      : undefined,
  });

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connecting = false;
    queueStartSocket();
  }, delay);
}

function scheduleLogoutRecovery(): void {
  if (logoutRecoveryTimer || sessionResetInProgress) return;
  clearReconnectTimer();
  lastQr = null;
  reconnectAttempts = 0;
  connectionState = 'closed';
  connecting = false;

  logger.warn(
    'WhatsApp: sesión invalidada (logout). Limpieza en 10 s; luego un QR nuevo. Cierra dispositivos vinculados viejos en el teléfono.',
  );

  logoutRecoveryTimer = setTimeout(() => {
    logoutRecoveryTimer = null;
    void (async () => {
      sessionResetInProgress = true;
      try {
        await closeSocket();
        await clearStoredSession();
        await new Promise((r) => setTimeout(r, LOGOUT_RECOVERY_DELAY_MS));
        queueStartSocket();
      } catch (e) {
        logger.warn('WhatsApp: recuperación tras logout falló', { err: e });
        connectionState = 'closed';
        connecting = false;
      } finally {
        sessionResetInProgress = false;
      }
    })();
  }, 2_000);
}

function scheduleFailedPairingRecovery(code: number | undefined): void {
  if (reconnectTimer || sessionResetInProgress || logoutRecoveryTimer) return;
  clearReconnectTimer();
  lastQr = null;
  connectionState = 'closed';
  connecting = false;

  logger.warn('WhatsApp: falló el emparejamiento (QR). Limpiando sesión parcial…', { code });

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void (async () => {
      sessionResetInProgress = true;
      try {
        await closeSocket();
        await clearStoredSession();
        await new Promise((r) => setTimeout(r, PAIRING_RETRY_DELAY_MS));
        reconnectAttempts = 0;
        queueStartSocket();
      } finally {
        sessionResetInProgress = false;
      }
    })();
  }, 1_000);
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
  await new Promise((r) => setTimeout(r, SOCKET_CLOSE_WAIT_MS));
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

async function startSocketInternal(): Promise<void> {
  if (!env.WHATSAPP_ENABLED) return;
  if (connecting || sessionResetInProgress) return;

  connecting = true;
  clearReconnectTimer();
  const gen = ++socketGeneration;
  connectionState = 'connecting';
  lastQr = null;

  try {
    await closeSocket();

    const baileys = await loadBaileys();
    const dir = await resolveAuthDir();
    const { state, saveCreds } = await baileys.useMultiFileAuthState(dir);

    const saveCredsAndMaybePersist = async () => {
      await saveCreds();
      if (connectionState === 'open') {
        schedulePersistDebounced();
      }
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
      void saveCredsAndMaybePersist();
    });

    sock.ev.on('connection.update', (update) => {
      if (gen !== socketGeneration) return;

      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        lastQr = qr;
        connectionState = 'qr';
        connecting = false;
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
        const wasOpen = connectionState === 'open';
        connectionState = 'closed';
        connecting = false;
        stopPersistInterval();
        lastQr = null;

        const code = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
        const loggedOut = code === baileys.DisconnectReason.loggedOut;

        if (loggedOut) {
          scheduleLogoutRecovery();
        } else if (!wasOpen && isSessionConflictCode(code)) {
          scheduleFailedPairingRecovery(code);
        } else {
          scheduleReconnect(code);
        }
      }
    });
  } catch (e) {
    connectionState = 'closed';
    connecting = false;
    lastQr = null;
    logger.error('WhatsApp: error al iniciar', { err: e });
  }
}

export async function initWhatsAppClient(): Promise<void> {
  if (!env.WHATSAPP_ENABLED) {
    connectionState = 'disabled';
    return;
  }
  queueStartSocket();
  await startSocketChain;
}

export async function restartWhatsAppClient(): Promise<void> {
  if (!env.WHATSAPP_ENABLED) return;
  await resetWhatsAppSession();
}

export async function resetWhatsAppSession(): Promise<void> {
  reconnectAttempts = 0;
  clearReconnectTimer();
  clearLogoutRecoveryTimer();
  sessionResetInProgress = true;
  socketGeneration += 1;
  stopPersistInterval();
  await closeSocket();
  await clearStoredSession();
  lastQr = null;
  connecting = false;
  connectionState = 'connecting';
  sessionResetInProgress = false;
  queueStartSocket(3_000);
  await startSocketChain;
}

/** Arranca el cliente si quedó en «closed» sin reintentos pendientes (p. ej. tras dormir en Render). */
export async function ensureWhatsAppClientRunning(): Promise<void> {
  if (!env.WHATSAPP_ENABLED) return;
  if (
    connecting ||
    reconnectTimer ||
    logoutRecoveryTimer ||
    sessionResetInProgress
  ) {
    return;
  }
  if (connectionState === 'open' || connectionState === 'qr') return;
  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) return;
  if (connectionState === 'closed') {
    queueStartSocket();
    await startSocketChain;
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
  clearLogoutRecoveryTimer();
  stopPersistInterval();
  if (connectionState === 'open') {
    await persistSession();
  }
  await closeSocket();
  connectionState = env.WHATSAPP_ENABLED ? 'closed' : 'disabled';
  connecting = false;
}
