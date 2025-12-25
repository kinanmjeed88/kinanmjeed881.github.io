
const CACHE_NAME = 'techtouch-v2'; // تم تحديث الإصدار لإجبار المتصفح على التحديث

// Install Event:
// تركنا هذه القائمة فارغة عمداً لمنع خطأ "Request failed" أثناء التثبيت.
// سيقوم الموقع بتخزين الملفات تلقائياً عند زيارتها (Runtime Caching).
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
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

// Fetch Event: Smart Caching Strategy
self.addEventListener('fetch', (event) => {
  // Only handle http/https requests
  if (!event.request.url.startsWith('http')) return;

  // استراتيجية: الشبكة أولاً، ثم الكاش (Network First, falling back to Cache)
  // هذه الاستراتيجية تضمن حصول المستخدم على أحدث محتوى، وتخزينه للمرات القادمة
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // تأكد أن الاستجابة صحيحة
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // نسخ الاستجابة لتخزينها في الكاش
        const responseToCache = networkResponse.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      })
      .catch(() => {
        // إذا فشل الاتصال بالشبكة (Offline)، ابحث في الكاش
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // إذا كان الطلب لصفحة html (تصفح) وغير موجودة في الكاش، ارجع للصفحة الرئيسية
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});