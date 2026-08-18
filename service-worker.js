const CACHE_NAME = 'ft-surveypro-v6';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  './assets/css/app.css',
  './assets/css/pondok.css',
  './assets/css/survey.css',
  './assets/css/insight.css',
  './assets/css/settings.css',
  './assets/css/auth.css',
  './assets/css/users.css',
  './assets/js/config.js',
  './assets/js/api.js',
  './assets/js/auth.js',
  './assets/js/app.js',
  './assets/js/pondok.js',
  './assets/js/survey.js',
  './assets/js/insight.js',
  './assets/js/settings.js',
  './assets/js/users.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/images/auth-character.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.hostname === 'script.google.com') {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
        .catch(() => caches.match('./offline.html'))
    );
    return;
  }

  if (
    url.origin === self.location.origin &&
    ['script', 'style'].includes(event.request.destination)
  ) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }))
  );
});
