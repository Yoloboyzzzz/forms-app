// Service worker for the PWA: keeps the app shell available when the connection drops.
// Supabase requests (another origin) are never cached; answers are saved through the app itself.
const CACHE = 'forms-shell-v1';
// The app may be hosted under a sub path (GitHub Pages), so every path is relative to the scope the worker was registered with.
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const STATIC_PREFIXES = [`${BASE}/_expo/static/`, `${BASE}/icons/`, `${BASE}/assets/`];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    // Pages: fresh from the network, the cached copy when offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(`${BASE}/`))),
    );
    return;
  }

  if (STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    // Built files have hashed names: serve from the cache first.
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});
