import 'express';

/**
 * Multer añade `req.files` con `.fields()`; @types/express 5 a veces no lo expone sin esto.
 */
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
      }
    }

    interface Request {
      files?: Record<string, Express.Multer.File[]>;
      /** Rellenada por mergeCurpFromPdfIntoBody cuando la CURP sale del PDF. */
      curpAutoFilledFromPdf?: boolean;
    }
  }
}

export {};
