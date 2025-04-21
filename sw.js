// Generate a unique cache name with timestamp
const CACHE_VERSION = 'v2.1';
const CACHE_NAME = `pgg-cache-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/styles.css',
    './js/security.js',
    './js/grid-generator.js',
    './js/ui-controller.js',
    './js/app.js',
    './manifest.webmanifest',
    './favicon.ico'
];

// Install event - cache assets
addEventListener('install', (event) => {
    console.log('Opened cache:', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                // Cache each asset individually to handle failures gracefully
                return Promise.all(
                    ASSETS_TO_CACHE.map(asset => {
                        return cache.add(asset)
                            .catch(error => {
                                console.warn(`Failed to cache ${asset}:`, error);
                                // Continue even if one asset fails to cache
                                return Promise.resolve();
                            });
                    })
                );
            })
            .then(() => {
                console.log('Cache installation completed');
                return skipWaiting();
            })
            .catch(error => {
                console.error('Cache installation failed:', error);
                // Don't fail the installation if caching fails
                return skipWaiting();
            })
    );
});

// Activate event - clean up old caches
addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return clients.claim();
        })
    );
});

// Fetch event - serve from cache or network
addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(location.origin)) {
        return;
    }

    // Skip chrome-extension requests
    if (event.request.url.startsWith('chrome-extension://')) {
        return;
    }

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response if found
                if (response) {
                    return response;
                }

                // Clone the request because it can only be used once
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then((response) => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Only cache certain file types
                    const contentType = response.headers.get('content-type');
                    if (contentType && (
                        contentType.includes('text/html') ||
                        contentType.includes('text/css') ||
                        contentType.includes('application/javascript') ||
                        contentType.includes('image/') ||
                        contentType.includes('application/json')
                    )) {
                        // Clone the response because it can only be used once
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch(error => {
                                console.warn('Failed to cache response:', error);
                            });
                    }

                    return response;
                });
            })
            .catch(() => {
                // If both cache and network fail, show offline page
                return caches.match('./');
            })
    );
});
