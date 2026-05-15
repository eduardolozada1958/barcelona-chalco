import * as dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Cargar el archivo .env según NODE_ENV
const nodeEnv = process.env.NODE_ENV ?? 'development';
const envFile = `.env.${nodeEnv}`;

dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config({ path: path.resolve(process.cwd(), '.env') }); // fallback

// Schema de validación de variables de entorno
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  API_PREFIX: z.string().default('/api/v1'),

  // Supabase
  SUPABASE_URL: z.string().url('SUPABASE_URL debe ser una URL válida'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY es requerida'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY es requerida'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS (puede ser lista separada por comas; el QR usa el primer origen si no hay APP_PUBLIC_URL)
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  /** URL pública del front (Pages), sin slash final. Si no se define, se usa el primer valor de CORS_ORIGIN. Importante para que el QR apunte a /credencial y no a otro host. */
  APP_PUBLIC_URL: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().url().optional()
  ),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),

  // Bcrypt
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),

  // Logs
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('pretty'),

  // Storage
  STORAGE_BUCKET_PLAYERS: z.string().default('players-avatars'),
  STORAGE_BUCKET_GALLERY: z.string().default('gallery'),
  STORAGE_BUCKET_NOTICES: z.string().default('notices-covers'),
  STORAGE_BUCKET_MATCH_LOGOS: z.string().default('match-logos'),
  /** Bucket privado: PDF de CURP (solo service role / URLs firmadas admin). */
  STORAGE_BUCKET_PLAYER_CURP: z.string().default('player-curp-documents'),
  STORAGE_MAX_FILE_SIZE: z.string().default('5242880').transform(Number),
  STORAGE_MAX_CURP_PDF_BYTES: z.string().default('10485760').transform(Number),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isDev  = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
export const isProd = env.NODE_ENV === 'production';
