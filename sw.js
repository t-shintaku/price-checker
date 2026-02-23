const CACHE_NAME = 'unit-price-app-v5';
const ASSETS_TO_CACHE = [
    '/price-checker/',
    '/price-checker/index.html',
    '/price-checker/style.css',
    '/price-checker/main.js',
    '/price-checker/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request).then((fetchResponse) => {
                    // Optional: dynamically cache new successful requests here if needed
                    return fetchResponse;
                });
            })
            .catch(() => {
                // If network fails and it's navigation, return index.html
                if (event.request.mode === 'navigate') {
                    return caches.match('/price-checker/index.html');
                }
            })
    );
});
