import { BadRequestError } from '@middlewares/error.middleware';

/** Convierte errores de Supabase Storage / Postgres en mensajes útiles para el cliente. */
export function throwStorageOrDbError(err: { message?: string }, context: string): never {
  const m = (err.message ?? String(err)).toLowerCase();

  if (m.includes('bucket not found') || (m.includes('bucket') && m.includes('not found'))) {
    throw new BadRequestError(
      'El almacenamiento de logos de partidos no está configurado. En Supabase crea el bucket público "match-logos" o ejecuta database/migrations/20260533_matches_opponent_logo_storage.sql',
    );
  }

  if (m.includes('opponent_logo_url') && (m.includes('column') || m.includes('does not exist'))) {
    throw new BadRequestError(
      'Falta la columna opponent_logo_url en matches. Ejecuta database/migrations/20260533_matches_opponent_logo_storage.sql en Supabase.',
    );
  }

  if (m.includes('mime') || m.includes('not allowed')) {
    throw new BadRequestError('Formato de imagen no permitido en el bucket (usa PNG, JPEG o WebP).');
  }

  throw new Error(`${context}: ${err.message ?? 'error desconocido'}`);
}
