// Service Worker for AI Tool Hub v5.1.2
const CACHE_NAME = 'ai-tool-hub-v5.1.2';

const PRECACHE_URLS = [
  './',
  './index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => console.warn('SW: precache failed:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (['chrome-extension:', 'file:', 'blob:', 'data:'].includes(url.protocol)) return;
  if (!['http:', 'https:'].includes(url.protocol)) return;
  if (url.origin !== self.location.origin) return;

  if (event.request.url.includes('tools.json')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request).then((net) => {
            if (net && net.status === 200) cache.put(event.request, net.clone());
            return net;
          }).catch(() => cached);

          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((net) => {
        if (net && net.status === 200 && net.type === 'basic') {
          caches.open(CACHE_NAME).then(c => c.put(event.request, net.clone()));
        }
        return net;
      }).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        return null;
      });
    })
  );
});
