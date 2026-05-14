import type { Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import { env } from '@config/env';
import { ValidationError } from '@middlewares/error.middleware';

const maxBytes = Math.max(env.STORAGE_MAX_FILE_SIZE, env.STORAGE_MAX_CURP_PDF_BYTES) + 65_536;

/** PDF de CURP + foto opcional; archivos en memoria para subirlos con service role. */
const _multer = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes, files: 2 },
}).fields([
  { name: 'curpPdf', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
]);

export function runPlayerCreateUpload(req: Request, res: Response, next: NextFunction): void {
  _multer(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return next(new ValidationError('Un archivo excede el tamaño máximo permitido'));
      }
      return next(err instanceof Error ? err : new Error(String(err)));
    }
    next();
  });
}
