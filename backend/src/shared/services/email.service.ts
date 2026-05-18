import nodemailer, { type Transporter } from 'nodemailer';

import { env, isDev } from '@config/env';
import { logger } from '@shared/utils/logger';

function smtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_FROM);
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!smtpConfigured()) {
    throw new Error('SMTP no configurado (SMTP_HOST y SMTP_FROM requeridos)');
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   env.SMTP_HOST,
      port:   env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
      /** Evita colgar el API si Gmail no responde (p. ej. desde Render). */
      connectionTimeout: 10_000,
      greetingTimeout:   10_000,
      socketTimeout:     20_000,
    });
  }
  return transporter;
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

  const send = getTransporter().sendMail({
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
