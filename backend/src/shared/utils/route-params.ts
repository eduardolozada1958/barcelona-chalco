import type { Request } from 'express';

/** Normaliza `req.params` (Express 5 puede usar string | string[]) a string. */
export function routeParam(req: Request, key: string): string {
  const v = req.params[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v[0] ?? '';
  return '';
}
