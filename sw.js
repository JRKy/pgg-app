// Generate a unique cache name with timestamp
const CACHE_VERSION = 'v4'; // Base version
const CACHE_TIMESTAMP = Date.now(); // Unique per deployment
const CACHE_NAME = `password-grid-cache-${CACHE_VERSION}-${CACHE_TIMESTAMP}`;

const urlsToCache = [
    '/', '/index.html', '/css/styles.css', '/js/app.js', '/js/grid-generator.js', 
    '/js/ui-controller.js', '/manifest.json', '/presets.json',
    '/img/icons/icon-192x192.png', '/img/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .catch(error => console.error('Cache installation failed:', error))
    );
    self.skipWaiting(); // Take control immediately
});

self.addEventListener('fetch', event => {
    event.respondWith(
        // Always try network first
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseToCache));
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache if network fails
                return caches.match(event.request)
                    .then(response => response || caches.match('/index.html'));
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control of all clients
    );
});
