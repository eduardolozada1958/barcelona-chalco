import nodemailer, { type Transporter } from 'nodemailer';

import { env, isDev, isProd } from '@config/env';
import { logger } from '@shared/utils/logger';

function smtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_FROM && env.SMTP_USER && env.SMTP_PASS);
}

/** Gmail: 465 = SSL directo; 587 = STARTTLS (hostname, no IP, para que TLS negocie bien). */
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
let verifyPromise: Promise<void> | null = null;

function getTransporter(): Transporter {
  if (!smtpConfigured()) {
    throw new Error('SMTP incompleto: SMTP_HOST, SMTP_FROM, SMTP_USER y SMTP_PASS son requeridos');
  }
  if (!transporter) {
    transporter = nodemailer.createTransport(smtpTransportOptions());
  }
  return transporter;
}

/** Comprueba conexión al arrancar (solo prod) para ver errores en logs de Render. */
export function verifySmtpOnStartup(): void {
  if (!smtpConfigured() || !isProd) return;

  verifyPromise = (async () => {
    const t = getTransporter();
    const opts = smtpTransportOptions();
    await t.verify();
    logger.info(
      `SMTP listo: ${opts.host}:${opts.port} (secure=${opts.secure}) usuario=${env.SMTP_USER}`,
    );
  })().catch((err: Error) => {
    logger.error(`SMTP no conecta al arrancar: ${err.message}`);
    if (/timeout|ETIMEDOUT|ECONNREFUSED|ENETUNREACH/i.test(err.message)) {
      logger.error(
        'Si usas Render plan Free, los puertos SMTP (587/465) están bloqueados; usa plan Starter o superior. ' +
          'En Gmail usa contraseña de aplicación y prueba SMTP_PORT=465 y SMTP_SECURE=true.',
      );
    }
  });
}

export type SendMailOptions = {
  to:      string;
  subject: string;
  text:    string;
  html:    string;
};

const SMTP_SEND_TIMEOUT_MS = 90_000;

export async function sendMail(opts: SendMailOptions): Promise<void> {
  if (!smtpConfigured()) {
    if (isDev) {
      logger.warn(`[SMTP omitido — dev] Para: ${opts.to}\n${opts.text}`);
      return;
    }
    throw new Error('El servidor de correo no está configurado');
  }

  if (verifyPromise) {
    await verifyPromise.catch(() => undefined);
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
      setTimeout(() => reject(new Error('Tiempo de espera agotado al enviar correo')), SMTP_SEND_TIMEOUT_MS);
    }),
  ]);
}

export function isEmailConfigured(): boolean {
  return smtpConfigured() || isDev;
}
