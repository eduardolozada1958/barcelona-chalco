import { BadRequestError } from '@middlewares/error.middleware';

const PDF_MAGIC = '%PDF';

export function isPdfBuffer(buf: Buffer): boolean {
  return buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === PDF_MAGIC;
}

export type DetectedImageMime = 'image/png' | 'image/jpeg' | 'image/webp';

export function detectImageMime(buf: Buffer): DetectedImageMime | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return 'image/png';
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46
    && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

const ALLOWED_IMAGE_MIMES = new Set<string>(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/pjpeg']);

export function assertPdfUpload(file: { buffer: Buffer; mimetype: string; originalname?: string }): void {
  if (file.mimetype !== 'application/pdf') {
    throw new BadRequestError('El documento debe ser PDF');
  }
  if (!isPdfBuffer(file.buffer)) {
    throw new BadRequestError('El archivo no es un PDF válido');
  }
}

export function assertImageUpload(file: { buffer: Buffer; mimetype: string }): void {
  if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
    throw new BadRequestError('Solo se permiten imágenes PNG, JPEG o WebP');
  }
  const detected = detectImageMime(file.buffer);
  if (!detected) {
    throw new BadRequestError('El archivo no es una imagen válida');
  }
  const declared = file.mimetype === 'image/jpg' || file.mimetype === 'image/pjpeg'
    ? 'image/jpeg'
    : file.mimetype;
  if (detected !== declared) {
    throw new BadRequestError('El tipo de imagen no coincide con el contenido del archivo');
  }
}
