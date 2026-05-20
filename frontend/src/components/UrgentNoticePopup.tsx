import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { listNoticesPublic } from '@/api/notices';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { Notice } from '@/types';

const DISMISS_KEY = 'barcelona-urgent-notice-dismissed';

function isExpired(notice: Notice): boolean {
  if (!notice.expires_at) return false;
  return new Date(notice.expires_at).getTime() < Date.now();
}

/** Popup modal para el aviso urgente publicado (estilo banner con imagen). */
export function UrgentNoticePopup() {
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ['notices-public-urgent-popup'],
    queryFn: () => listNoticesPublic({ type: 'urgent', limit: 5, page: 1 }),
    staleTime: 60_000,
  });

  const notice = useMemo(() => {
    const rows = (q.data?.data ?? []) as Notice[];
    return rows.find((n) => n.type === 'urgent' && n.is_published && !isExpired(n));
  }, [q.data?.data]);

  useEffect(() => {
    if (!notice) {
      setOpen(false);
      return;
    }
    const dismissed = sessionStorage.getItem(`${DISMISS_KEY}-${notice.id}`);
    setOpen(!dismissed);
  }, [notice?.id]);

  if (!notice || !open) return null;

  const dismiss = () => {
    sessionStorage.setItem(`${DISMISS_KEY}-${notice.id}`, String(Date.now()));
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="urgent-notice-title"
    >
      <div className="relative w-full max-w-4xl max-h-[min(92dvh,720px)] flex flex-col rounded-xl sm:rounded-2xl overflow-hidden bg-surface-container-lowest border border-outline-variant/30 shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-2 right-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 touch-manipulation"
          aria-label="Cerrar aviso"
        >
          <MaterialIcon name="close" size={26} />
        </button>

        {notice.cover_image_url ? (
          <div className="shrink-0 w-full bg-surface-container max-h-[38vh] sm:max-h-[42vh] overflow-hidden">
            <img
              src={notice.cover_image_url}
              alt=""
              className="w-full h-full object-cover object-center"
            />
          </div>
        ) : (
          <div className="shrink-0 h-2 bg-gradient-to-r from-error via-primary to-error" aria-hidden />
        )}

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-8 py-5 sm:py-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-error text-on-error font-label-caps text-[10px] px-2.5 py-1 rounded-sm">
              URGENTE
            </span>
            <MaterialIcon name="campaign" className="text-error" size={22} />
          </div>
          <h2 id="urgent-notice-title" className="font-headline-lg text-xl sm:text-2xl text-on-surface pr-10">
            {notice.title}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-on-surface-variant whitespace-pre-wrap leading-relaxed">
            {notice.content}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/avisos/${notice.id}`}
              onClick={dismiss}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-caps text-[11px] hover:shadow-gold-glow"
            >
              Ver aviso completo
              <MaterialIcon name="arrow_forward" size={16} />
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex items-center gap-1 px-4 py-2.5 rounded-lg border border-outline-variant/40 text-on-surface-variant font-label-caps text-[11px] hover:border-primary hover:text-primary"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
