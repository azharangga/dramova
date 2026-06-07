/**
 * Dramova · Catalog Pre-fetcher
 * Dimuat segera setelah core ready. Crawl semua platform paralel di background
 * dan simpan ke window.__DRAMOVA_CATALOG__ agar search.js & serial.js bisa
 * langsung pakai tanpa nunggu crawl ulang.
 */
(function () {
  const D = window.DramSi;
  if (!D || !D.Platforms) return;

  // ── Shared global cache ───────────────────────────────────────────────────
  if (!window.__DRAMOVA_CATALOG__) {
    window.__DRAMOVA_CATALOG__ = {};
  }
  const CACHE = window.__DRAMOVA_CATALOG__;

  function getEntry(plat) {
    if (!CACHE[plat]) {
      CACHE[plat] = { items: [], fullyLoaded: false, crawlPromise: null, listeners: [] };
    }
    return CACHE[plat];
  }

  // Notify semua listener yang sedang menunggu update
  function notify(plat, isDone) {
    const entry = getEntry(plat);
    entry.listeners.forEach((fn) => {
      try { fn(entry.items, isDone, plat); } catch (_) {}
    });
    if (isDone) entry.listeners = [];
  }

  const MAX_PAGES = 20;

  /**
   * Crawl satu platform sampai habis. Fetch 5 halaman paralel sekaligus,
   * tanpa jeda antar batch supaya secepat mungkin.
   */
  function crawl(plat) {
    const entry = getEntry(plat);
    if (entry.fullyLoaded || entry.crawlPromise) return entry.crawlPromise || Promise.resolve();

    const seenIds = new Set(entry.items.map((it) => it.id));
    const BATCH = 5; // halaman paralel per round

    entry.crawlPromise = (async () => {
      let page = 1;

      outer: while (page <= MAX_PAGES) {
        const pages = Array.from({ length: Math.min(BATCH, MAX_PAGES - page + 1) }, (_, i) => page + i);
        const results = await Promise.allSettled(
          pages.map((p) => D.Platforms[plat].home(p, {}))
        );

        let gotNew = false;
        let anyHasMore = false;

        for (const r of results) {
          if (r.status !== 'fulfilled') continue;
          const data = D.unwrap(r.value) || {};
          const newItems = (data.items || []).filter((it) => it.id && !seenIds.has(it.id));
          newItems.forEach((it) => seenIds.add(it.id));
          entry.items.push(...newItems);
          if (newItems.length > 0) gotNew = true;
          if (data.hasMore !== false && (data.items || []).length >= 6) anyHasMore = true;
        }

        if (gotNew) notify(plat, false);
        if (!anyHasMore || !gotNew) break outer;

        page += BATCH;
      }

      entry.fullyLoaded = true;
      entry.crawlPromise = null;
      notify(plat, true);
    })();

    return entry.crawlPromise;
  }

  /**
   * Subscribe ke update catalog satu platform.
   * Kalau sudah ada data, callback langsung dipanggil dengan data yang ada.
   * Kalau crawl sudah selesai, callback dipanggil sekali dengan isDone=true lalu unsubscribe.
   */
  function subscribe(plat, callback) {
    const entry = getEntry(plat);
    // Langsung panggil dengan snapshot saat ini
    if (entry.items.length > 0) {
      callback(entry.items, entry.fullyLoaded, plat);
    }
    if (entry.fullyLoaded) return;
    entry.listeners.push(callback);
    crawl(plat);
  }

  /**
   * Mulai pre-crawl semua platform tanpa tunggu — fire & forget.
   * Hasilnya disimpan di CACHE dan bisa dipakai kapan saja.
   */
  function prefetchAll() {
    const allPlatforms = [
      ...(D.SERIAL_PLATFORMS || []).map((p) => p.id),
      ...(D.MOVIE_PLATFORMS || []).map((p) => p.id),
    ];
    // Crawl semua paralel tanpa saling tunggu
    allPlatforms.forEach((plat) => crawl(plat));
  }

  // Export ke global
  window.__DRAMOVA_PREFETCH__ = { crawl, subscribe, getEntry, CACHE };

  // Mulai pre-crawl segera
  prefetchAll();
})();
