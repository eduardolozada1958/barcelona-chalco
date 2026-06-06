import { useCallback, useEffect, useState } from 'react';

import { STORAGE_KEYS } from '@utils/constants';

const MOBILE_MAX_PX = 768;

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(max-width: ${MOBILE_MAX_PX}px)`).matches;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function wasIntroDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.MOBILE_INTRO_DISMISSED) === '1';
  } catch {
    return false;
  }
}

export function getIntroVideoUrl(): string | null {
  const url = import.meta.env.VITE_INTRO_VIDEO_URL?.trim();
  if (url) return url;
  return '/videos/intro-mobile.mp4';
}

export function useMobileIntro() {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const evaluate = () => {
      const show =
        isMobileViewport() &&
        !prefersReducedMotion() &&
        !wasIntroDismissed() &&
        Boolean(getIntroVideoUrl());
      setVisible(show);
      setReady(true);
    };

    evaluate();
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_PX}px)`);
    mq.addEventListener('change', evaluate);
    return () => mq.removeEventListener('change', evaluate);
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOBILE_INTRO_DISMISSED, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, []);

  const dismissOnError = useCallback(() => {
    setVisible(false);
  }, []);

  return { visible, ready, dismiss, dismissOnError };
}
