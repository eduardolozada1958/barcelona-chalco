import {
  assertImageUpload,
  assertPdfUpload,
  detectImageMime,
  isPdfBuffer,
} from '../../src/shared/utils/file-magic';

describe('file-magic (validación de subidas)', () => {
  it('detecta PDF por magic bytes', () => {
    const pdf = Buffer.from('%PDF-1.4 fake');
    expect(isPdfBuffer(pdf)).toBe(true);
    expect(() => assertPdfUpload({ buffer: pdf, mimetype: 'application/pdf' })).not.toThrow();
  });

  it('rechaza PDF falso', () => {
    const fake = Buffer.from('NOTPDF');
    expect(() => assertPdfUpload({ buffer: fake, mimetype: 'application/pdf' })).toThrow(
      /PDF válido/i,
    );
  });

  it('detecta PNG y rechaza MIME incorrecto', () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]);
    expect(detectImageMime(png)).toBe('image/png');
    expect(() => assertImageUpload({ buffer: png, mimetype: 'image/png' })).not.toThrow();
    expect(() => assertImageUpload({ buffer: png, mimetype: 'image/jpeg' })).toThrow(
      /no coincide/i,
    );
  });
});
