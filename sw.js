// Service Worker for AI Tool Hub v2.0
const CACHE_NAME = 'ai-tool-hub-v2.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './tools.json',
  './topics.json',
  './manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // 过滤不支持的 URL scheme (chrome-extension, file, blob, data)
  const url = new URL(event.request.url);
  const unsupportedSchemes = ['chrome-extension:', 'file:', 'blob:', 'data:'];
  
  if (unsupportedSchemes.includes(url.protocol)) {
    // 跳过这些请求，不缓存
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((fetchResponse) => {
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }
        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return fetchResponse;
      });
    })
  );
});
