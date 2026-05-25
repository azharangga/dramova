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
  '/shorts',
  '/series',
  '/search',
  '/history',
  '/css/app.css',
  '/js/api.js',
  '/js/state.js',
  '/js/ui.js',
  '/js/video-optimize.js',
  '/js/motion.js',
  '/js/pull-refresh.js',
  '/js/toast.js',
  '/js/pwa.js',
  '/js/detail.js',
  '/js/search.js',
  '/js/discover.js',
  '/js/serial.js',
  '/js/library.js',
  '/js/shorts.js',
  '/js/shorts-feed.js',
  '/js/watch.js',
  '/img/favicon.png',
  '/img/icon.png',
  '/img/logo.png',
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
  if (url.pathname.startsWith('/goodshort/playlist')) return;
  if (url.pathname.startsWith('/goodshort/aeskey')) return;

  // API calls — network-first, fallback to cache
  if (url.pathname.startsWith('/api/kdrama/video') || url.pathname.startsWith('/api/kdrama/stream')) {
    event.respondWith(networkOnly(request, 20000));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE, 8000));
    return;
  }

  // Static assets — cache-first with network fallback
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages — network-first
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, CACHE_NAME, 4000));
    return;
  }

  // Default: network with cache fallback
  event.respondWith(networkFirst(request, CACHE_NAME, 8000));
});

function isStaticAsset(pathname) {
  return pathname.startsWith('/js/') ||
         pathname.startsWith('/css/') ||
         pathname.startsWith('/img/') ||
         pathname === '/manifest.webmanifest';
}

// ── Strategies ─────────────────────────────────────────────────────
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
