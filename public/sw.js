const CACHE_NAME = 'smartlms-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/window.svg',
  '/globe.svg',
  '/file.svg',
  '/next.svg',
  '/vercel.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/v1/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful role-count responses
          if (response.ok && url.searchParams.get('action') === 'role-count') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache for role-count when offline
          if (url.searchParams.get('action') === 'role-count') {
            return caches.match(event.request).then(cachedResponse => {
              if (cachedResponse) return cachedResponse;
              // If no cache, return a safe default
              return new Response(JSON.stringify({ teachers: 0, admins: 0, total: 0 }), {
                headers: { 'Content-Type': 'application/json' }
              });
            });
          }
          return caches.match(event.request);
        })
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        return cachedResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
