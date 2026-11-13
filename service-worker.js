const CACHE_NAME = 'pamyat-pwa-v5';
const CORE_ASSETS = [
  './', './index.html', './catalog.html', './product.html', './cart.html',
  './checkout.html', './coming-soon.html', './contacts.html', './team.html',
  './css/style.css', './js/app.js', './js/chibi.js', './assets/asmodey.webp', './manifest.webmanifest', './assets/icon.svg', './assets/character-male.webp', './assets/character-female.webp', './assets/catalog-wreath.webp', './assets/hero-memorial.webp'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then(cached => {
    if (cached) return cached;
    return fetch(event.request).then(response => {
      if (response && response.status === 200 && (event.request.destination === 'image' || event.request.destination === 'style' || event.request.destination === 'script')) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match('./index.html'));
  }));
});
