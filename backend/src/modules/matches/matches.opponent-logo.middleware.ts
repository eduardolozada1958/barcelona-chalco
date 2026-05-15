import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { env } from '@config/env';
import { ValidationError } from '@middlewares/error.middleware';

const _upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.STORAGE_MAX_FILE_SIZE, files: 1 },
}).single('logo');

function isMulterFileSizeLimit(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'LIMIT_FILE_SIZE'
  );
}

/** Escudo del rival (PNG/JPEG/WebP) en memoria para subir a Storage. */
export function runOpponentLogoUpload(req: Request, res: Response, next: NextFunction): void {
  _upload(req, res, (err: unknown) => {
    if (err) {
      if (isMulterFileSizeLimit(err)) {
        return next(new ValidationError('El logo supera el tamaño máximo permitido'));
      }
      return next(err instanceof Error ? err : new Error(String(err)));
    }
    next();
  });
}
