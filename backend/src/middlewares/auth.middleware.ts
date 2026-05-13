import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@config/env';
import { UnauthorizedError } from './error.middleware';
import type { JwtPayload, AuthenticatedUser } from '@shared/types';

// Extiende el tipo Request para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      /** Correlación de logs (middleware requestContext) */
      requestId?: string;
      /** Salida de validateQuery (Zod) */
      validatedQuery?: unknown;
      log?: import('winston').Logger;
    }
  }
}

// Middleware: valida el token JWT en el header Authorization
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de acceso requerido'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = {
      id:       decoded.sub,
      email:    decoded.email,
      role:     decoded.role,
      fullName: '',
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Token expirado'));
    }
    return next(new UnauthorizedError('Token inválido'));
  }
}

// Middleware: autenticación opcional (no falla si no hay token)
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id:       decoded.sub,
      email:    decoded.email,
      role:     decoded.role,
      fullName: '',
    };
  } catch {
    // Token inválido - continuar sin usuario
  }

  next();
}
