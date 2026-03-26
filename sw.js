// Aguadilla Reporta — Service Worker
const CACHE_NAME = 'aguadilla-reporta-v1';
const CACHE_URLS = [
    '/aguadilla/index.html',
    '/aguadilla/aguadilla-reporta-completo.html',
    '/aguadilla/consulta.html',
    '/aguadilla/mis-reportes.html',
    '/aguadilla/transparencia.html',
    '/aguadilla/login.html',
    '/aguadilla/manifest.json'
];

// Install: cache key pages
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Aguadilla Reporta: caching pages');
            return cache.addAll(CACHE_URLS).catch(err => {
                console.log('Cache partial:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', event => {
    // Skip Google Apps Script requests — always need network
    if (event.request.url.includes('script.google.com')) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful HTML responses
                if (response.ok && event.request.destination === 'document') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => {
                // Offline fallback
                return caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    // Return offline page for navigation
                    if (event.request.destination === 'document') {
                        return caches.match('/aguadilla/index.html');
                    }
                });
            })
    );
});
