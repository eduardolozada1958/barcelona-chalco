import { supabaseAdmin } from '@config/database';
import { logger } from '@shared/utils/logger';
import { NoticesService } from '@modules/notices/notices.service';
import { GalleryService } from '@modules/gallery/gallery.service';

const TICK_MS = 60_000;

async function publishDueNotices(): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('notices')
    .select('id')
    .eq('is_published', false)
    .eq('is_archived', false)
    .is('deleted_at', null)
    .not('scheduled_publish_at', 'is', null)
    .lte('scheduled_publish_at', now);

  if (error) throw new Error(error.message);
  let n = 0;
  for (const row of data ?? []) {
    const id = String((row as { id: string }).id);
    try {
      await NoticesService.publish(id);
      n += 1;
    } catch (e) {
      logger.warn('Programación aviso: falló publicar', { id, err: e });
    }
  }
  return n;
}

async function publishDueGallery(): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('gallery_posts')
    .select('id')
    .eq('is_published', false)
    .eq('is_archived', false)
    .is('deleted_at', null)
    .not('scheduled_publish_at', 'is', null)
    .lte('scheduled_publish_at', now);

  if (error) throw new Error(error.message);
  let n = 0;
  for (const row of data ?? []) {
    const id = String((row as { id: string }).id);
    try {
      await GalleryService.publish(id);
      n += 1;
    } catch (e) {
      logger.warn('Programación galería: falló publicar', { id, err: e });
    }
  }
  return n;
}

async function tick(): Promise<void> {
  const notices = await publishDueNotices();
  const gallery = await publishDueGallery();
  if (notices > 0 || gallery > 0) {
    logger.info('Publicaciones programadas procesadas', { notices, gallery });
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startScheduledPublishRunner(): void {
  if (intervalId) return;
  void tick().catch((e) => logger.warn('Programación: error en primer tick', { err: e }));
  intervalId = setInterval(() => {
    void tick().catch((e) => logger.warn('Programación: error en tick', { err: e }));
  }, TICK_MS);
}

export function stopScheduledPublishRunner(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
