/* =====================================================================
   Dramova · Service Worker — Offline-first caching strategy
   Cache: static assets (cache-first), API (network-first), pages (stale-while-revalidate)
   ===================================================================== */

const CACHE_NAME   = 'dramsi-v31';
const STATIC_CACHE = 'dramsi-static-v25';
const API_CACHE    = 'dramsi-api-v25';

const STATIC_ASSETS = [
  '/',
  '/discover',
  '/series',
  '/movie',
  '/search',
  '/history',
  '/static/css/app.css',
  '/static/js/api.js',
  '/static/js/state.js',
  '/static/js/ui.js',
  '/static/js/motion.js',
  '/static/js/pull-refresh.js',
  '/static/js/toast.js',
  '/static/js/pwa.js',
  '/static/js/detail.js',
  '/static/js/search.js',
  '/static/js/discover.js',
  '/static/js/serial.js',
  '/static/js/movie.js',
  '/static/js/library.js',
  '/static/img/favicon.png',
  '/static/img/icon.png',
  '/static/img/logo.png',
  '/manifest.webmanifest',
];

// ── Install: pre-cache static assets ──────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ─────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![CACHE_NAME, STATIC_CACHE, API_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
});

// ── Fetch: routing strategy ────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Skip video/stream proxies — always network
  if (url.pathname.startsWith('/proxy/')) return;

  // API calls — network-first, fallback to cache
  if (url.pathname.startsWith('/api/serial/kdrama/video')) {
    event.respondWith(networkOnly(request, 20000));
    return;
  }

  if (url.pathname.startsWith('/api/serial/kdrama/')) {
    event.respondWith(networkFirst(request, API_CACHE, 20000));
    return;
  }

  if (isApiRequest(url.pathname)) {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // Static assets — cache-first
  if (isAppShellAsset(url.pathname)) {
    event.respondWith(networkFirst(request, STATIC_CACHE, 2500));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages — stale-while-revalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, CACHE_NAME, 3500));
    return;
  }

  // Default: network with cache fallback
  event.respondWith(networkFirst(request, CACHE_NAME, 8000));
});

function isApiRequest(pathname) {
  return pathname.startsWith('/api/serial/') ||
         pathname.startsWith('/api/movie/');
}

function isStaticAsset(pathname) {
  return pathname.startsWith('/static/') ||
         pathname === '/manifest.webmanifest';
}

// ── Strategies ─────────────────────────────────────────────────────
function isAppShellAsset(pathname) {
  return pathname === '/static/css/app.css' ||
         pathname.startsWith('/static/js/');
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName, timeout = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    clearTimeout(timer);
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ status: false, error: 'offline' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503,
    });
  }
}

async function networkOnly(request, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (_) {
    clearTimeout(timer);
    return new Response(JSON.stringify({ status: false, error: 'network_failed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503,
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || fetchPromise;
}
