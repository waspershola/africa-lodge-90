const CACHE_VERSION = Date.now();
const CACHE_NAME = `guest-portal-v${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  '/offline.html',
  '/manifest.json'
];

// Never cache these patterns
const NEVER_CACHE_PATTERNS = [
  /\/functions\/v1\//,           // Supabase Edge Functions
  /dxisnnjsbuuiunjmzzqj\.supabase\.co/, // Supabase API
  /\/rest\/v1\//,                 // Supabase REST API
  /\/auth\/v1\//,                 // Supabase Auth API
  /\/realtime\/v1\//,             // Supabase Realtime
  /\/storage\/v1\//,              // Supabase Storage
  /\/graphql\/v1\//,              // GraphQL endpoints
  /\.(hot-update\.js|hot-update\.json)$/, // Vite HMR
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

// Fetch event - network first for APIs, minimal caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Never cache these patterns - always network only with original request (preserve all headers)
  const shouldNeverCache = NEVER_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
  
  if (shouldNeverCache) {
    event.respondWith(
      fetch(request) // Use original request to preserve all headers including apikey
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Offline - network required' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // For navigation requests (HTML pages) - network first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Don't cache navigation responses to ensure fresh app bundle
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // For static assets (JS, CSS, images) - network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Only cache successful responses for truly static assets
        if (networkResponse.ok && (
          url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?)$/) ||
          url.pathname === '/offline.html' ||
          url.pathname === '/manifest.json'
        )) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache only for static assets
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
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
