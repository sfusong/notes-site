const CACHE_VERSION = 'notes-site-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const CONTENT_CACHE = `${CACHE_VERSION}-content`;
const APP_SHELL_URLS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './vendor/marked.min.js',
  './icons/app-icon.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then(cache => cache.addAll(APP_SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => ![APP_SHELL_CACHE, CONTENT_CACHE].includes(key))
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isLocalContentRequest(url) {
  return url.origin === self.location.origin && (
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/css/style.css') ||
    url.pathname.endsWith('/js/app.js') ||
    url.pathname.endsWith('/vendor/marked.min.js') ||
    url.pathname.endsWith('/notes/index.json') ||
    url.pathname.endsWith('/notes/search-index.json') ||
    url.pathname.includes('/notes/') ||
    url.pathname.endsWith('/icons/app-icon.svg')
  );
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const cloned = response.clone();
          caches.open(APP_SHELL_CACHE).then(cache => cache.put('./index.html', cloned));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (!isLocalContentRequest(url)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request)
        .then(response => {
          const cloned = response.clone();
          const targetCache = url.pathname.includes('/notes/') ? CONTENT_CACHE : APP_SHELL_CACHE;
          caches.open(targetCache).then(cache => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
