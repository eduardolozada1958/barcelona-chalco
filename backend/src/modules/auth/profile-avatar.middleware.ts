import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { env } from '@config/env';
import { ValidationError } from '@middlewares/error.middleware';

const _upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.STORAGE_MAX_FILE_SIZE, files: 1 },
}).single('avatar');

export function runProfileAvatarUpload(req: Request, res: Response, next: NextFunction): void {
  _upload(req, res, (err: unknown) => {
    if (err) {
      const code = typeof err === 'object' && err !== null && 'code' in err
        ? (err as { code?: string }).code
        : undefined;
      if (code === 'LIMIT_FILE_SIZE') {
        return next(new ValidationError('La imagen excede el tamaño máximo permitido'));
      }
      return next(err instanceof Error ? err : new Error(String(err)));
    }
    next();
  });
}
