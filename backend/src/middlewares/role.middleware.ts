import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from './error.middleware';
import type { UserRole } from '@shared/types';

// Factory: genera un middleware que restringe a los roles indicados
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Debes autenticarte primero'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}`
        )
      );
    }

    next();
  };
}

// Atajos de rol
export const requireAdmin        = requireRole('admin');
export const requireCoach        = requireRole('coach');
export const requireParent       = requireRole('parent');
export const requireAdminOrCoach = requireRole('admin', 'coach');
