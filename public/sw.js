const CACHE_NAME = 'guest-portal-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/guest/qr',
  '/offline.html',
  '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - network only, queue if offline
  if (request.url.includes('/functions/v1/qr-unified-api')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Offline - request queued' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // Fallback to offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Background sync for queued requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncQueuedRequests());
  }
});

async function syncQueuedRequests() {
  // This will be triggered by the background sync API
  console.log('Service Worker: Syncing queued requests');
  // The actual sync logic is handled by useOfflineSync hook
}
