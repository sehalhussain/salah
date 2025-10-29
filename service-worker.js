const CACHE_NAME = 'salah-quran-v1.5'; // Bump version to trigger update
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx', // This is critical for offline startup
  '/_data-quran-font-indopak-nastaleeq.css', // Cache font CSS
  '/font/UthmanicHafs_V22.woff2', // Cache Uthmani font
  '/font/indopak-nastaleeq.woff2', // Cache IndoPak font
  '/manifest.json',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
];

// Install event: Cache the essential app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching essential app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activate new service worker immediately
      .catch(error => {
        console.error('Failed to cache core assets during install:', error);
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients
  );
});

// Fetch event: Stale-while-revalidate strategy
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Return from cache if found, and fetch update in background.
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Check if we received a valid response
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });

        // Return the cached response immediately if available, otherwise wait for the network response.
        // If network fails and there is no cache, the fetchPromise rejection will correctly propagate.
        return response || fetchPromise;
      });
    })
  );
});