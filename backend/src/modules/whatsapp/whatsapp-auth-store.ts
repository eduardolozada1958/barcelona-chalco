import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '@config/database';
import { logger } from '@shared/utils/logger';

const TABLE = 'whatsapp_auth_files';

/** Descarga la sesión guardada en Supabase a una carpeta temporal (Render Free). */
export async function hydrateAuthDirFromSupabase(targetDir: string): Promise<number> {
  const { data, error } = await supabaseAdmin.from(TABLE).select('file_name, content');
  if (error) throw new Error(error.message);
  if (!data?.length) return 0;

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const row of data) {
    const name = String((row as { file_name: string }).file_name);
    const content = String((row as { content: string }).content);
    fs.writeFileSync(path.join(targetDir, name), content, 'utf8');
  }

  return data.length;
}

/** Sube todos los archivos de la carpeta de auth a Supabase. */
export async function persistAuthDirToSupabase(sourceDir: string): Promise<void> {
  if (!fs.existsSync(sourceDir)) return;

  const names = fs.readdirSync(sourceDir).filter((n) => n.endsWith('.json'));
  if (names.length === 0) return;

  const rows = names.map((file_name) => ({
    file_name,
    content:    fs.readFileSync(path.join(sourceDir, file_name), 'utf8'),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabaseAdmin.from(TABLE).upsert(rows, { onConflict: 'file_name' });
  if (error) {
    logger.warn('WhatsApp: no se pudo guardar sesión en Supabase', { err: error.message });
    throw new Error(error.message);
  }
  logger.debug('WhatsApp: sesión guardada en Supabase', { files: names.length });
}

export async function clearAuthInSupabase(): Promise<void> {
  const { error } = await supabaseAdmin.from(TABLE).delete().neq('file_name', '');
  if (error) throw new Error(error.message);
}
