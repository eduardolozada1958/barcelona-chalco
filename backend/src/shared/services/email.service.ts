import nodemailer, { type Transporter } from 'nodemailer';

import { env, isDev, isProd } from '@config/env';
import { logger } from '@shared/utils/logger';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SEND_TIMEOUT_MS = 30_000;

export type SendMailOptions = {
  to:      string;
  subject: string;
  text:    string;
  html:    string;
};

function brevoConfigured(): boolean {
  return Boolean(env.BREVO_API_KEY && env.BREVO_SENDER_EMAIL);
}

function smtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_FROM && env.SMTP_USER && env.SMTP_PASS);
}

async function sendViaBrevo(opts: SendMailOptions): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const res = await fetch(BREVO_API_URL, {
      method:  'POST',
      signal:  controller.signal,
      headers: {
        accept:         'application/json',
        'api-key':      env.BREVO_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name:  env.BREVO_SENDER_NAME,
          email: env.BREVO_SENDER_EMAIL,
        },
        to: [{ email: opts.to }],
        subject:     opts.subject,
        htmlContent: opts.html,
        textContent: opts.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Brevo ${res.status}: ${body}`);
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al enviar correo (Brevo)');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function smtpTransportOptions() {
  const host = env.SMTP_HOST!;
  const port = env.SMTP_PORT;
  const useSsl = env.SMTP_SECURE || port === 465;

  return {
    host,
    port,
    secure: useSsl,
    requireTLS: !useSsl,
    auth: {
      user: env.SMTP_USER!,
      pass: env.SMTP_PASS!,
    },
    tls: {
      minVersion: 'TLSv1.2' as const,
      servername: host,
    },
    connectionTimeout: 60_000,
    greetingTimeout:   30_000,
    socketTimeout:     60_000,
  };
}

let transporter: Transporter | null = null;
let smtpVerifyPromise: Promise<void> | null = null;

function getTransporter(): Transporter {
  if (!smtpConfigured()) {
    throw new Error('SMTP incompleto: SMTP_HOST, SMTP_FROM, SMTP_USER y SMTP_PASS son requeridos');
  }
  if (!transporter) {
    transporter = nodemailer.createTransport(smtpTransportOptions());
  }
  return transporter;
}

async function sendViaSmtp(opts: SendMailOptions): Promise<void> {
  if (smtpVerifyPromise) {
    await smtpVerifyPromise.catch(() => undefined);
  }

  const transport = getTransporter();
  const send = transport.sendMail({
    from:    env.SMTP_FROM,
    to:      opts.to,
    subject: opts.subject,
    text:    opts.text,
    html:    opts.html,
  });

  await Promise.race([
    send,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Tiempo de espera agotado al enviar correo')), SEND_TIMEOUT_MS);
    }),
  ]);
}

/** Comprueba correo al arrancar (prod). */
export function verifyEmailOnStartup(): void {
  if (!isProd) return;

  if (brevoConfigured()) {
    logger.info(
      `Correo vía Brevo: remitente="${env.BREVO_SENDER_NAME}" <${env.BREVO_SENDER_EMAIL}>`,
    );
    return;
  }

  if (!smtpConfigured()) return;

  smtpVerifyPromise = (async () => {
    const t = getTransporter();
    const opts = smtpTransportOptions();
    await t.verify();
    logger.info(
      `SMTP listo: ${opts.host}:${opts.port} (secure=${opts.secure}) usuario=${env.SMTP_USER}`,
    );
  })().catch((err: Error) => {
    logger.error(`SMTP no conecta al arrancar: ${err.message}`);
  });
}

export async function sendMail(opts: SendMailOptions): Promise<void> {
  if (brevoConfigured()) {
    await sendViaBrevo(opts);
    logger.info(`Correo enviado (Brevo) a ${opts.to}`);
    return;
  }

  if (smtpConfigured()) {
    await sendViaSmtp(opts);
    return;
  }

  if (isDev) {
    logger.warn(`[Correo omitido — dev] Para: ${opts.to}\n${opts.text}`);
    return;
  }

  throw new Error(
    'Correo no configurado: define BREVO_API_KEY + BREVO_SENDER_EMAIL (recomendado en Render Free) o SMTP_*',
  );
}

export function isEmailConfigured(): boolean {
  return brevoConfigured() || smtpConfigured() || isDev;
}
