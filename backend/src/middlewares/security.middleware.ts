import type { Request, Response, NextFunction } from 'express';

/** Cabeceras adicionales alineadas con OWASP (complementan helmet). */
export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}

/** Rechaza cuerpos con demasiados campos (abuso / mass assignment). */
export function rejectOversizedJsonKeys(maxKeys = 80) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      next();
      return;
    }
    const body = req.body;
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      if (Object.keys(body as object).length > maxKeys) {
        res.status(400).json({
          success: false,
          message: 'Cuerpo de petición inválido',
        });
        return;
      }
    }
    next();
  };
}
