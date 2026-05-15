import pdfParse from 'pdf-parse';

const CURP_18 = /^[A-Z0-9Ñ]{18}$/i;
/** Patrón típico INEGI (suficiente para filtrar ruido en texto plano). */
const CURP_SHAPE = /^[A-ZÑ]{4}\d{6}[HM][A-Z]{2}[A-Z0-9]{5}[0-9A-Z]\d$/i;

function normalizeCurp(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9Ñ]/g, '');
}

/** Busca la CURP en texto extraído del PDF (etiqueta Clave/CURP o candidatos de 18 caracteres). */
export function findCurpInExtractedText(text: string): string | undefined {
  const flat = text.replace(/\s+/g, ' ');
  const labeled = flat.match(/(?:Clave|CURP)\s*:?\s*([A-Z0-9Ñ]{18})\b/i);
  if (labeled) {
    const c = normalizeCurp(labeled[1]);
    if (CURP_18.test(c)) return c;
  }
  const re18 = /\b([A-Z0-9Ñ]{18})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re18.exec(flat)) !== null) {
    const c = normalizeCurp(m[1]);
    if (CURP_SHAPE.test(c) || CURP_18.test(c)) return c;
  }
  return undefined;
}

/** Extrae texto del PDF y devuelve la CURP si hay capa de texto (no sirve para escaneo solo-imagen). */
export async function extractCurpFromPdfBuffer(buffer: Buffer): Promise<string | undefined> {
  const data = await pdfParse(buffer);
  const raw = data?.text;
  const text = typeof raw === 'string' ? raw : '';
  if (!text.trim()) return undefined;
  return findCurpInExtractedText(text);
}
