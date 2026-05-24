const CACHE_NAME = 'aethelis-cache-v1';
const ASSETS_TO_CACHE = [
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'icon.png'
];

// Събитие по инсталация - записваме файловете в локалния кеш
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Събитие по активиране - почистване на стари кешове при обновяване на кода
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
});

// Прехващане на мрежови заявки - ако сме офлайн, зареждаме директно от кеша
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});