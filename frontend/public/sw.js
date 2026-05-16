/* Service worker: notificaciones push de avisos del club */
self.addEventListener('push', (event) => {
  let payload = { title: 'Nuevo aviso', body: '', url: '/avisos' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* ignore */
  }

  const isUrgent = payload.type === 'urgent';
  event.waitUntil(
    self.registration.showNotification(payload.title || 'Nuevo aviso', {
      body: payload.body || '',
      icon: '/images/logo.webp',
      badge: '/images/logo.webp',
      tag: `barcelona-notice-${payload.url || 'default'}`,
      renotify: true,
      silent: false,
      vibrate: isUrgent ? [400, 120, 400, 120, 400] : [200, 100, 200],
      data: { url: payload.url || '/avisos' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/avisos';
  const absolute = target.startsWith('http') ? target : new URL(target, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(absolute);
    }),
  );
});
