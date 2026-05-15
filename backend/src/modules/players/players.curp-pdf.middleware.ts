import type { Request, Response, NextFunction } from 'express';
import { extractCurpFromPdfBuffer } from './curp-from-pdf';

function isPdfBuffer(buf: Buffer): boolean {
  return buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === '%PDF';
}

function curpFieldEmpty(body: Record<string, unknown>): boolean {
  const c = body.curp;
  if (c === undefined || c === null) return true;
  if (typeof c === 'string' && c.trim() === '') return true;
  return false;
}

/**
 * Si el formulario no trae CURP en texto y el PDF tiene capa de texto, rellena `req.body.curp`
 * antes de `validateBody` (solo lectura local del buffer).
 */
export async function mergeCurpFromPdfIntoBody(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const mf = req.files as Record<string, Express.Multer.File[]> | undefined;
    const pdf = mf?.curpPdf?.[0];
    if (!pdf?.buffer || pdf.mimetype !== 'application/pdf') {
      return next();
    }
    const buf = pdf.buffer as Buffer;
    if (!isPdfBuffer(buf)) return next();

    const body = req.body as Record<string, unknown>;
    if (!curpFieldEmpty(body)) return next();

    const extracted = await extractCurpFromPdfBuffer(buf);
    if (!extracted) return next();

    body.curp = extracted;
    req.curpAutoFilledFromPdf = true;
  } catch {
    /* sin texto en PDF o error al leer: no bloquear el alta */
  }
  next();
}
