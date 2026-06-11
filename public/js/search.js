/* Search page · platform-aware streaming search with smart ranking. */
(function () {
  const D = window.DramSi;

  const form = document.getElementById('searchForm');
  const input = document.getElementById('searchInput');
  const grid = document.getElementById('searchGrid');
  const hint = document.getElementById('searchHint');
  const platformBtn = document.getElementById('searchPlatformBtn');
  const clearBtn = document.getElementById('clearSearchBtn');
  const loadMoreBtn = document.getElementById('loadMoreBtn');

  const state = { platform: 'all', keyword: '', visibleCount: 24, ranked: [] };
  let debounceId = null;
  let searchToken = 0;

  const MAX_CRAWL_PAGES = 15; // per platform

  function escapeHTML(value) {
    return String(value || '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
  }

  // ── Smart search helpers ───────────────────────────────────────────────────
  function normalizeQuery(q) {
    return String(q || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenize(text) {
    return normalizeQuery(text).split(' ').filter(Boolean);
  }

  function searchScore(title, synopsis, queryTokens) {
    const normTitle = normalizeQuery(title);
    const normSyn = normalizeQuery(synopsis || '');
    const queryStr = queryTokens.join(' ');

    if (normTitle === queryStr) return 100;
    if (normTitle.startsWith(queryStr)) return 80;
    if (normTitle.includes(queryStr)) return 60;

    const titleTokens = tokenize(normTitle);
    if (queryTokens.every((t) => titleTokens.some((tt) => tt.startsWith(t)))) return 50;
    if (queryTokens.some((t) => normTitle.includes(t))) return 30;
    if (queryTokens.some((t) => normSyn.includes(t))) return 10;
    return 0;
  }

  function deduplicateResults(results) {
    const seen = new Set();
    return results.filter(({ item, platform }) => {
      const key = `${normalizeQuery(item.title || '')}_${platform}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function rankResults(results, queryTokens) {
    return [...results].sort((a, b) => {
      const sA = searchScore(a.item.title, a.item.synopsis || a.item.description || '', queryTokens);
      const sB = searchScore(b.item.title, b.item.synopsis || b.item.description || '', queryTokens);
      if (sB !== sA) return sB - sA;
      const infoA = (a.item.cover || a.item.image) ? 1 : 0;
      const infoB = (b.item.cover || b.item.image) ? 1 : 0;
      return infoB - infoA;
    });
  }
  // ──────────────────────────────────────────────────────────────────────────

  // ── Per-platform catalog cache — pakai shared prefetch cache ─────────────
  function getCatalog(plat) {
    if (window.__DRAMOVA_PREFETCH__) return window.__DRAMOVA_PREFETCH__.getEntry(plat);
    if (!window.__DRAMOVA_CATALOG__) window.__DRAMOVA_CATALOG__ = {};
    if (!window.__DRAMOVA_CATALOG__[plat]) {
      window.__DRAMOVA_CATALOG__[plat] = { items: [], fullyLoaded: false, crawlPromise: null, listeners: [] };
    }
    return window.__DRAMOVA_CATALOG__[plat];
  }

  function crawlPlatform(plat, onBatch) {
    if (window.__DRAMOVA_PREFETCH__) {
      window.__DRAMOVA_PREFETCH__.subscribe(plat, onBatch);
      return Promise.resolve();
    }
    // Fallback: crawl sendiri kalau prefetch belum inject
    const cat = getCatalog(plat);
    if (cat.fullyLoaded) { if (onBatch) onBatch(cat.items, true, plat); return Promise.resolve(); }
    if (cat.crawlPromise) { return cat.crawlPromise.then(() => { if (onBatch) onBatch(cat.items, true, plat); }); }
    const seenIds = new Set(cat.items.map((it) => it.id));
    cat.crawlPromise = (async () => {
      let page = 1;
      while (page <= 15) {
        const pages = Array.from({ length: 5 }, (_, i) => page + i);
        const results = await Promise.allSettled(pages.map((p) => D.Platforms[plat].home(p, {})));
        let gotNew = false, anyMore = false;
        for (const r of results) {
          if (r.status !== 'fulfilled') continue;
          const data = D.unwrap(r.value) || {};
          const newItems = (data.items || []).filter((it) => it.id && !seenIds.has(it.id));
          newItems.forEach((it) => seenIds.add(it.id));
          cat.items.push(...newItems);
          if (newItems.length > 0) gotNew = true;
          if (data.hasMore !== false && (data.items || []).length >= 6) anyMore = true;
        }
        if (gotNew && onBatch) onBatch(cat.items, false, plat);
        if (!anyMore || !gotNew) break;
        page += 5;
      }
      cat.fullyLoaded = true;
      cat.crawlPromise = null;
      if (onBatch) onBatch(cat.items, true, plat);
    })();
    return cat.crawlPromise;
  }
  // ──────────────────────────────────────────────────────────────────────────

  const urlParams = new URLSearchParams(location.search);
  if (urlParams.get('q')) input.value = urlParams.get('q');

  function syncClearBtn() {
    clearBtn.hidden = !input.value.trim();
  }

  function platformItems() {
    const serialSub = (D.SERIAL_PLATFORMS || []).map((p) => p.label).join(', ');
    const movieSub = (D.MOVIE_PLATFORMS || []).map((p) => p.label).join(', ');
    return [
      { value: 'all', label: D.t('search.all_platforms'), sub: D.t('search.all_platforms_sub') },
      { value: 'serial', label: 'Serial', sub: serialSub },
      { value: 'movie', label: 'Movie', sub: movieSub },
    ];
  }

  function getActivePlatforms() {
    if (state.platform === 'serial') {
      return D.SERIAL_PLATFORMS || [];
    }
    if (state.platform === 'movie') {
      return D.MOVIE_PLATFORMS || [];
    }
    // all
    return [
      ...(D.SERIAL_PLATFORMS || []),
      ...(D.MOVIE_PLATFORMS || []),
    ];
  }

  // ── Render hasil gabungan ke grid ──────────────────────────────────────────
  function renderResults(allByPlatform, queryTokens, isDoneMap) {
    const isDoneAll = Object.values(isDoneMap).every(Boolean);

    // Gabungkan semua
    const combined = [];
    for (const [plat, items] of Object.entries(allByPlatform)) {
      for (const item of items) {
        const score = searchScore(item.title, item.synopsis || item.description || '', queryTokens);
        if (score > 0) combined.push({ item, platform: plat, score });
      }
    }

    const deduped = deduplicateResults(combined.map(({ item, platform }) => ({ item, platform })));
    // Re-score setelah dedup
    const ranked = deduped
      .map(({ item, platform }) => ({
        item, platform,
        score: searchScore(item.title, item.synopsis || item.description || '', queryTokens),
      }))
      .sort((a, b) => b.score - a.score);

    const hintEl = document.getElementById('searchHint');
    if (hintEl) {
      hintEl.innerHTML = D.t('search.sub');
      hintEl.style.color = '';
    }

    if (ranked.length === 0) {
      if (!isDoneAll) {
        // Masih loading — tampilkan skeleton
        if (!grid.querySelector('.skeleton')) grid.innerHTML = D.buildSkeletons(12);
        return;
      }
      grid.innerHTML = `
        <div class="col-span-full py-16 flex flex-col items-center text-center gap-3">
          <div class="search-empty-icon grid h-16 w-16 place-items-center rounded-2xl">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <p class="search-empty-title text-sm font-bold">${escapeHTML(D.t('search.empty_title', { keyword: state.keyword }))}</p>
          <p class="search-empty-subtitle text-xs">${D.t('search.empty_sub')}</p>
        </div>`;
      return;
    }

    state.ranked = ranked;
    const visibleItems = ranked.slice(0, state.visibleCount);
    
    grid.innerHTML = visibleItems.map(({ item, platform }) => D.buildPoster(item, platform)).join('');
    window.refreshIcons?.();
    if (isDoneAll) D.motion?.staggerGrid?.(grid);
    if (loadMoreBtn) {
      loadMoreBtn.hidden = !isDoneAll || ranked.length <= state.visibleCount;
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  async function doSearch(keyword) {
    syncClearBtn();
    const token = ++searchToken;

    if (!keyword || keyword.trim().length === 0) {
      state.keyword = '';
      state.visibleCount = 24;
      grid.innerHTML = '';
      if (loadMoreBtn) loadMoreBtn.hidden = true;
      // Reset hint ke default
      const hintEl = document.getElementById('searchHint');
      if (hintEl) {
        hintEl.innerHTML = D.t('search.sub');
        hintEl.style.color = '';
      }
      return;
    }

    state.keyword = keyword.trim();
    const queryTokens = tokenize(state.keyword);
    const platforms = getActivePlatforms();

    if (platforms.length === 0) {
      D.toast?.info?.('Tidak ada platform aktif.');
      return;
    }

    // Selalu tampilkan skeleton di awal pencarian
    state.visibleCount = 24;
    grid.innerHTML = D.buildSkeletons(12);
    if (loadMoreBtn) loadMoreBtn.hidden = true;
    D.motion?.showProgress?.();

    // State tracking per platform
    const allByPlatform = {};
    const isDoneMap = {};
    platforms.forEach((p) => {
      allByPlatform[p.id] = getCatalog(p.id).items.slice();
      isDoneMap[p.id] = getCatalog(p.id).fullyLoaded;
    });

    // Render snapshot awal dari cache kalau ada hasil yang cocok
    const hasCache = platforms.some((p) => getCatalog(p.id).items.length > 0);
    if (hasCache) {
      renderResults(allByPlatform, queryTokens, isDoneMap);
    }

    // Crawl tiap platform secara paralel, update UI setiap ada data baru
    const crawlPromises = platforms.map((p) => {
      if (getCatalog(p.id).fullyLoaded) return Promise.resolve();

      return crawlPlatform(p.id, (items, isDone, plat) => {
        if (token !== searchToken) return;
        allByPlatform[plat] = items;
        isDoneMap[plat] = isDone;
        renderResults(allByPlatform, queryTokens, isDoneMap);
      });
    });

    await Promise.allSettled(crawlPromises);
    D.motion?.hideProgress?.();

    if (token !== searchToken) return;

    // Final render
    platforms.forEach((p) => {
      allByPlatform[p.id] = getCatalog(p.id).items;
      isDoneMap[p.id] = true;
    });
    renderResults(allByPlatform, queryTokens, isDoneMap);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(debounceId);
    doSearch(input.value);
  });

  input.addEventListener('input', () => {
    syncClearBtn();
    clearTimeout(debounceId);
    debounceId = setTimeout(() => doSearch(input.value), 350);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    syncClearBtn();
    clearTimeout(debounceId);
    doSearch('');
    input.focus();
  });

  platformBtn.addEventListener('click', () => {
    D.openSheet({
      title: D.t('search.platform_title'),
      current: state.platform,
      items: platformItems(),
      onPick: (id) => {
        state.platform = id;
        if (state.keyword) doSearch(state.keyword);
      },
    });
  });

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      state.visibleCount += 24;
      grid.insertAdjacentHTML('beforeend', D.buildSkeletons(6));
      loadMoreBtn.disabled = true;
      setTimeout(() => {
        const visibleItems = state.ranked.slice(0, state.visibleCount);
        grid.querySelectorAll('.poster-skeleton-card').forEach((s) => s.remove());
        const startIdx = grid.children.length;
        const html = visibleItems.slice(startIdx).map(({ item, platform }) => D.buildPoster(item, platform)).join('');
        grid.insertAdjacentHTML('beforeend', html);
        loadMoreBtn.disabled = false;
        loadMoreBtn.hidden = state.ranked.length <= state.visibleCount;
      }, 50); // slight delay for smooth UI
    });
  }

  document.addEventListener('lang:changed', () => { if (state.keyword) doSearch(state.keyword); });

  if (input.value.trim()) doSearch(input.value);
  syncClearBtn();
})();
