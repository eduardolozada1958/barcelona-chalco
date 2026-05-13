import winston from 'winston';
import { env } from '@config/env';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const prettyFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}${metaStr}`
      : `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

const jsonFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: env.LOG_FORMAT === 'json' ? jsonFormat : prettyFormat,
  transports: [
    new winston.transports.Console(),
  ],
  silent: env.NODE_ENV === 'test',
});
