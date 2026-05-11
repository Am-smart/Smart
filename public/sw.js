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
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/v1/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone immediately before any other operation
          const responseToCache = response.clone();

          if (response.ok && url.searchParams.get('action') === 'role-count') {
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
        // Clone immediately before any other operation or checks
        const responseToCache = networkResponse.clone();

        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

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

// Push Notification Handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/window.svg',
      badge: '/window.svg',
      tag: data.tag || (data.data && data.data.url) || 'smartlms-general', // Smart tag based on URL or fallback
      renotify: true,
      data: {
        url: (data.data && data.data.url) || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (err) {
    console.error('Error handling push event:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Ensure we have an absolute URL
  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Try to find a window already open at this exact URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // 2. Try to find any window belonging to our app and navigate it
      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client) {
          client.focus();
          return client.navigate(urlToOpen);
        }
      }

      // 3. If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
