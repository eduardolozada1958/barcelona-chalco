import dns from 'dns/promises';
import nodemailer, { type Transporter } from 'nodemailer';

import { env, isDev } from '@config/env';
import { logger } from '@shared/utils/logger';

function smtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_FROM);
}

let transporterPromise: Promise<Transporter> | null = null;

/** Render no tiene egress IPv6; conectar por A record evita ENETUNREACH a smtp.gmail.com. */
async function getTransporter(): Promise<Transporter> {
  if (!smtpConfigured()) {
    throw new Error('SMTP no configurado (SMTP_HOST y SMTP_FROM requeridos)');
  }
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const hostname = env.SMTP_HOST!;
      let connectHost = hostname;
      try {
        const v4 = await dns.resolve4(hostname);
        if (v4[0]) connectHost = v4[0];
      } catch (err) {
        logger.warn(`SMTP: no se resolvió IPv4 de ${hostname}, usando hostname: ${(err as Error).message}`);
      }

      return nodemailer.createTransport({
        host:   connectHost,
        port:   env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        tls:    { servername: hostname },
        auth:
          env.SMTP_USER && env.SMTP_PASS
            ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
            : undefined,
        connectionTimeout: 10_000,
        greetingTimeout:   10_000,
        socketTimeout:     20_000,
      });
    })();
  }
  return transporterPromise;
}

export type SendMailOptions = {
  to:      string;
  subject: string;
  text:    string;
  html:    string;
};

const SMTP_SEND_TIMEOUT_MS = 25_000;

export async function sendMail(opts: SendMailOptions): Promise<void> {
  if (!smtpConfigured()) {
    if (isDev) {
      logger.warn(`[SMTP omitido — dev] Para: ${opts.to}\n${opts.text}`);
      return;
    }
    throw new Error('El servidor de correo no está configurado');
  }

  const transport = await getTransporter();
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
