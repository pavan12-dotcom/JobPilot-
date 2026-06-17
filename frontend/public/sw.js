// frontend/public/sw.js
const CACHE_NAME = 'jobpilot-cache-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ── Install: cache core assets ───────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE).catch(() => {}))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for assets ─────────────────────
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  // Skip Next.js HMR websocket and API calls
  if (e.request.url.includes('/_next/webpack-hmr') || e.request.url.includes('/api/')) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        return res;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

// ── Push: receive push notification from server ───────────────────────────────
self.addEventListener('push', (e) => {
  let data = { title: 'JobPilot', body: 'You have a new update.', url: '/' };
  try { data = { ...data, ...e.data.json() }; } catch (_) {}

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || 'jobpilot-push',
    data: { url: data.url || '/' },
    requireInteraction: false,
    vibrate: [100, 50, 100],
    actions: data.actions || [],
  };

  e.waitUntil(self.registration.showNotification(data.title, options));
});

// ── Notification click: focus / open the app ─────────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const targetUrl = e.notification.data?.url || '/';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Notification close (user dismissed) ──────────────────────────────────────
self.addEventListener('notificationclose', (_e) => {
  // Analytics hook: could POST to backend here
});
