import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { env } from '@config/env';
import { ValidationError } from '@middlewares/error.middleware';

const IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const _multer = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.STORAGE_MAX_FILE_SIZE, files: 20 },
}).array('images', 20);

function isMulterFileSizeLimit(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'LIMIT_FILE_SIZE'
  );
}

/** Hasta 20 imágenes (PNG/JPEG/WebP) para una entrada de galería. */
export function runGalleryMediaUpload(req: Request, res: Response, next: NextFunction): void {
  _multer(req, res, (err: unknown) => {
    if (err) {
      if (isMulterFileSizeLimit(err)) {
        return next(new ValidationError('Alguna imagen supera el tamaño máximo permitido'));
      }
      return next(err instanceof Error ? err : new Error(String(err)));
    }
    next();
  });
}

export function assertGalleryImageFiles(files: Express.Multer.File[]): void {
  if (!files.length) {
    throw new ValidationError('Adjunta al menos una imagen (PNG, JPEG o WebP)', [{ field: 'images', message: 'Requerido' }]);
  }
  for (const f of files) {
    if (!IMAGE_MIMES.has(f.mimetype)) {
      throw new ValidationError('Solo se permiten imágenes PNG, JPEG o WebP', [{ field: 'images', message: 'Formato no permitido' }]);
    }
  }
}
