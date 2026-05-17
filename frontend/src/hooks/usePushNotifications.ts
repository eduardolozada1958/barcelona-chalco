import { useCallback, useEffect, useState } from 'react';
import { getPushVapidPublicKey, subscribePush, unsubscribePush } from '@/api/push';
import { iosPushRequiresHomeScreen } from '@/utils/push-platform';

const STORAGE_SUBSCRIBED = 'push_subscribed_endpoint';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

export type PushUiState =
  | 'unsupported'
  | 'loading'
  | 'ready'
  | 'subscribed'
  | 'denied'
  | 'unconfigured'
  | 'ios_needs_install';

export function usePushNotifications() {
  const [state, setState] = useState<PushUiState>('loading');
  const [busy, setBusy] = useState(false);

  const checkExisting = useCallback(async () => {
    if (iosPushRequiresHomeScreen()) {
      setState('ios_needs_install');
      return;
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }

    const keyRes = await getPushVapidPublicKey();
    if (!keyRes.data?.publicKey) {
      setState('unconfigured');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      const saved = localStorage.getItem(STORAGE_SUBSCRIBED);
      if (sub && saved === sub.endpoint) {
        setState('subscribed');
        return;
      }
      setState(Notification.permission === 'granted' ? 'ready' : 'ready');
    } catch {
      setState('ready');
    }
  }, []);

  useEffect(() => {
    if (iosPushRequiresHomeScreen()) {
      setState('ios_needs_install');
      return;
    }
    if (!('serviceWorker' in navigator)) {
      setState('unsupported');
      return;
    }
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(() => checkExisting())
      .catch(() => setState('unsupported'));
  }, [checkExisting]);

  const subscribe = useCallback(async () => {
    if (state === 'unsupported' || state === 'unconfigured' || state === 'denied') return;
    setBusy(true);
    try {
      const keyRes = await getPushVapidPublicKey();
      const publicKey = keyRes.data?.publicKey;
      if (!publicKey) {
        setState('unconfigured');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });
      }

      const p256dh = sub.getKey('p256dh');
      const auth = sub.getKey('auth');
      if (!p256dh || !auth) throw new Error('Claves de suscripción inválidas');

      await subscribePush({
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(p256dh),
          auth:   arrayBufferToBase64(auth),
        },
      });

      localStorage.setItem(STORAGE_SUBSCRIBED, sub.endpoint);
      setState('subscribed');
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setBusy(false);
    }
  }, [state]);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      localStorage.removeItem(STORAGE_SUBSCRIBED);
      setState('ready');
    } finally {
      setBusy(false);
    }
  }, []);

  return { state, busy, subscribe, unsubscribe };
}
