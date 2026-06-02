import jwt from 'jsonwebtoken';
import { env, isProd, isTest } from '@config/env';
import { logger } from '@shared/utils/logger';
import type { JwtPayload } from '@shared/types';

const MS_PER_DAY = 86_400_000;

function verifyWithRotation<T extends jwt.JwtPayload>(
  token: string,
  current: string,
  previous: string | undefined,
): T {
  try {
    return jwt.verify(token, current) as T;
  } catch (first) {
    if (!previous) throw first;
    try {
      return jwt.verify(token, previous) as T;
    } catch {
      throw first;
    }
  }
}

export function signWithAccessSecret(payload: object, expiresIn: string): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function signAccessToken(payload: JwtPayload, expiresIn?: string): string {
  return signWithAccessSecret(payload, expiresIn ?? env.JWT_EXPIRES_IN);
}

export function verifyAccessTokenPayload<T extends jwt.JwtPayload>(token: string): T {
  return verifyWithRotation<T>(token, env.JWT_SECRET, env.JWT_SECRET_PREVIOUS);
}

export function verifyAccessToken(token: string): JwtPayload {
  return verifyAccessTokenPayload<JwtPayload>(token);
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyRefreshToken(token: string): JwtPayload {
  return verifyWithRotation<JwtPayload>(
    token,
    env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_SECRET_PREVIOUS,
  );
}

/** Aviso al arranque si el secreto supera JWT_ROTATION_MAX_DAYS. */
export function checkJwtRotationOnStartup(): void {
  if (isTest) return;

  const check = (label: string, rotatedAt: string | undefined, hasPrevious: boolean) => {
    if (!rotatedAt) {
      if (isProd) {
        logger.warn('jwt_rotation', {
          message: `${label}: define JWT_*_ROTATED_AT (ISO) en Render para auditar rotación cada ${env.JWT_ROTATION_MAX_DAYS} días.`,
        });
      }
      return;
    }
    const ageDays = (Date.now() - new Date(rotatedAt).getTime()) / MS_PER_DAY;
    if (Number.isNaN(ageDays)) {
      logger.warn('jwt_rotation', { message: `${label}: JWT_*_ROTATED_AT no es fecha ISO válida.` });
      return;
    }
    if (ageDays > env.JWT_ROTATION_MAX_DAYS) {
      logger.error('jwt_rotation', {
        message: `${label} supera ${env.JWT_ROTATION_MAX_DAYS} días. Rota el secreto y mueve el actual a *_PREVIOUS.`,
        ageDays: Math.floor(ageDays),
        hasPreviousSecret: hasPrevious,
      });
    } else if (ageDays > env.JWT_ROTATION_MAX_DAYS - 14) {
      logger.warn('jwt_rotation', {
        message: `${label} próximo a rotación (${Math.floor(ageDays)} días).`,
      });
    }
  };

  check('JWT_SECRET', env.JWT_SECRET_ROTATED_AT, Boolean(env.JWT_SECRET_PREVIOUS));
  check(
    'JWT_REFRESH_SECRET',
    env.JWT_REFRESH_SECRET_ROTATED_AT,
    Boolean(env.JWT_REFRESH_SECRET_PREVIOUS),
  );
}
