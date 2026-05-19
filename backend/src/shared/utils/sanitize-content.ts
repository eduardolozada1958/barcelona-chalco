/**
 * Sanitiza texto de usuario para almacenar/mostrar como texto plano (anti-XSS en APIs).
 * React escapa en render; esto evita guardar HTML/script en la base de datos.
 */
export function sanitizePlainText(raw: string, maxLength: number): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/** Rechaza patrones de inyección obvios en texto corto (comentarios, títulos). */
export function containsDangerousTextPatterns(text: string): boolean {
  return /javascript\s*:/i.test(text)
    || /data\s*:\s*text\/html/i.test(text)
    || /on\w+\s*=/i.test(text)
    || /<\s*script/i.test(text);
}
