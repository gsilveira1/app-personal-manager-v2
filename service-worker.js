const STATIC_CACHE_NAME = 'site-static-v1';
const DYNAMIC_CACHE_NAME = 'site-dynamic-v1';

// Add core app shell assets to cache
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/App.tsx',
  '/store.ts',
  '/types.ts',
  '/services/apiService.ts',
  '/components/ui.tsx',
  '/components/Layout.tsx'
];

// Install service worker
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log('Caching core assets');
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
        .map(key => caches.delete(key))
      );
    })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', evt => {
  // For API requests, use a network-first strategy
  if (evt.request.url.includes('/api/')) {
    evt.respondWith(
      fetch(evt.request)
        .then(fetchRes => {
          return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            // Check if the response is valid before caching
            if (fetchRes.ok) {
                cache.put(evt.request.url, fetchRes.clone());
            }
            return fetchRes;
          });
        })
        .catch(() => caches.match(evt.request)) // Fallback to cache if network fails
    );
    return;
  }

  // For other requests, use a cache-first strategy
  evt.respondWith(
    caches.match(evt.request).then(cacheRes => {
      return cacheRes || fetch(evt.request).then(fetchRes => {
        return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
          // Check if the response is valid before caching
          if (fetchRes.ok) {
            cache.put(evt.request.url, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    })
  );
});
