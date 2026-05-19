import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@config/database';
import { env } from '@config/env';
import { UnauthorizedError } from './error.middleware';
import type { JwtPayload, AuthenticatedUser } from '@shared/types';
import { getCachedUser, setCachedUser } from '@shared/utils/user-cache';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
      validatedQuery?: unknown;
      log?: import('winston').Logger;
    }
  }
}

async function loadActiveUser(userId: string): Promise<AuthenticatedUser | null> {
  const cached = getCachedUser(userId);
  if (cached) return cached;

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, role, full_name, status, email_verified, deleted_at')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data || data.deleted_at) return null;
  if (data.status !== 'active') return null;

  const user: AuthenticatedUser = {
    id:       data.id as string,
    email:    data.email as string,
    role:     data.role as AuthenticatedUser['role'],
    fullName: (data.full_name as string) ?? '',
  };
  setCachedUser(userId, user);
  return user;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  void authMiddlewareAsync(req, res, next).catch(next);
}

async function authMiddlewareAsync(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Token de acceso requerido'));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await loadActiveUser(decoded.sub);

    if (!user) {
      next(new UnauthorizedError('Usuario no encontrado o inactivo'));
      return;
    }

    if (decoded.role !== user.role || decoded.email !== user.email) {
      next(new UnauthorizedError('Sesión inválida. Vuelve a iniciar sesión.'));
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expirado'));
      return;
    }
    next(new UnauthorizedError('Token inválido'));
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  void optionalAuthMiddlewareAsync(req, res, next).catch(next);
}

async function optionalAuthMiddlewareAsync(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await loadActiveUser(decoded.sub);
    if (user && decoded.role === user.role && decoded.email === user.email) {
      req.user = user;
    }
  } catch {
    // Token inválido — continuar sin usuario
  }

  next();
}
