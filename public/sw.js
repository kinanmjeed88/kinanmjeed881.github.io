
const CACHE_NAME = 'techtouch-v1';
// تمت إزالة './' من هنا لأنها تسبب خطأ "Request failed" في بعض الاستضافات أثناء التثبيت
// سيتم التعامل مع الصفحة الرئيسية من خلال المنطق الموجود في الأسفل (Fetch Event)
const STATIC_ASSETS = [
  './index.html',
  './manifest.json'
];

// Install Event: Cache critical static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Only handle http/https requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Don't cache if response is not valid
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache JS, CSS, and Images dynamically
        const responseToCache = networkResponse.clone();
        if (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|json)$/)) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }

        return networkResponse;
      }).catch(() => {
        // Offline fallback for navigation requests
        // إذا انقطع النت وحاول المستخدم فتح الموقع، نعطيه index.html المحفوظ
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
