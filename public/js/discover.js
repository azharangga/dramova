/* Discover page · unified catalog browser (shorts + serial). */
(function () {
  const D = window.DramSi;

  const grid = document.getElementById('discoverGrid');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const searchInput = document.getElementById('discoverSearch');
  const searchClear = document.getElementById('discoverSearchClear');
  const filterBtn = document.getElementById('discoverFilterBtn');

  const SERIAL_PLATFORMS = (D.SERIAL_PLATFORMS || []).map((p) => p.id);
  const MOVIE_PLATFORMS = (D.MOVIE_PLATFORMS || []).map((p) => p.id);
  const PAGE_SIZE = 24;

  const storedFilter = D.Store.get(D.STORAGE.DISCOVER_CAT, 'all') || 'all';
  const state = {
    filter: storedFilter === 'shorts' ? 'all' : storedFilter,
    keyword: '',
    page: 1,
    items: [],
    hasMore: true,
    searchTimer: null,
  };

  function categoryItems() {
    return [
      { value: 'all', label: D.t('discover.cat_all') },
      { value: 'serial', label: 'Serial', sub: D.t('discover.cat_serial_sub') },
      { value: 'movie', label: 'Movie', sub: D.t('discover.cat_movie_sub') },
    ];
  }

  function shuffle(arr) {
    const pool = [...arr];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }

  function withPlatform(item, platform) {
    return { ...item, __platform: item.__platform || platform };
  }

  function escapeHTML(value) {
    return String(value || '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
  }

  function renderGrid() {
    if (state.items.length === 0) {
      const isSearch = Boolean(state.keyword);
      if (isSearch) {
        grid.innerHTML = `
          <div class="col-span-full py-16 flex flex-col items-center text-center gap-3">
            <div class="search-empty-icon grid h-16 w-16 place-items-center rounded-2xl">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <p class="search-empty-title text-sm font-bold">${escapeHTML(D.t('search.empty_title', { keyword: state.keyword }))}</p>
            <p class="search-empty-subtitle text-xs">${D.t('search.empty_sub')}</p>
          </div>`;
      } else {
        grid.innerHTML = `<div class="col-span-full empty-state">${D.t('discover.empty')}</div>`;
      }
      return;
    }
    grid.innerHTML = state.items.map((it) =>
      D.buildPoster(it, it.__platform || SERIAL_PLATFORMS[0] || MOVIE_PLATFORMS[0])
    ).join('');
    window.refreshIcons?.();
  }

  async function loadSerial(page) {
    const settled = await Promise.allSettled(
      SERIAL_PLATFORMS.map((p) =>
        D.Platforms[p].home(page).then((res) => {
          const data = D.unwrap(res) || {};
          return (data.items || []).map((it) => withPlatform(it, p));
        })
      )
    );
    const fulfilled = settled.filter((r) => r.status === 'fulfilled');
    const allItems = fulfilled.flatMap((r) => r.value);
    return { items: shuffle(allItems).slice(0, PAGE_SIZE), hasMore: allItems.length >= 12 };
  }

  async function loadMovie(page) {
    const settled = await Promise.allSettled(
      MOVIE_PLATFORMS.map((p) =>
        D.Platforms[p].home(page).then((res) => {
          const data = D.unwrap(res) || {};
          return (data.items || []).map((it) => withPlatform(it, p));
        })
      )
    );
    const fulfilled = settled.filter((r) => r.status === 'fulfilled');
    const allItems = fulfilled.flatMap((r) => r.value);
    return { items: shuffle(allItems).slice(0, PAGE_SIZE), hasMore: allItems.length >= 12 };
  }

  async function loadAll(page) {
    const [serialResult, movieResult] = await Promise.allSettled([
      loadSerial(page),
      loadMovie(page),
    ]);
    const serialItems = serialResult.status === 'fulfilled' ? serialResult.value.items : [];
    const movieItems = movieResult.status === 'fulfilled' ? movieResult.value.items : [];
    const combined = shuffle([...serialItems, ...movieItems]).slice(0, PAGE_SIZE);
    const hasMore = (serialItems.length >= 6) || (movieItems.length >= 6);
    return { items: combined, hasMore };
  }

  async function searchPlatforms(keyword) {
    const platforms = state.filter === 'serial'
      ? SERIAL_PLATFORMS
      : state.filter === 'movie'
        ? MOVIE_PLATFORMS
        : [...SERIAL_PLATFORMS, ...MOVIE_PLATFORMS];

    const settled = await Promise.allSettled(
      platforms.map((p) =>
        D.Platforms[p].search(keyword).then((res) => {
          const data = D.unwrap(res) || {};
          const items = data.items || data.books || [];
          return items.map((it) => withPlatform(it, p));
        })
      )
    );
    const fulfilled = settled.filter((r) => r.status === 'fulfilled');
    if (!fulfilled.length && settled.length) {
      throw settled[0]?.reason || new Error(D.friendlyError?.());
    }
    return shuffle(fulfilled.flatMap((r) => r.value));
  }

  async function load(reset = true) {
    if (reset) {
      state.page = 1;
      state.items = [];
      state.hasMore = true;
      grid.innerHTML = D.buildSkeletons(PAGE_SIZE);
      loadMoreBtn.hidden = true;
      D.motion?.showProgress?.();
    } else {
      loadMoreBtn.disabled = true;
      grid.insertAdjacentHTML('beforeend', D.buildSkeletons(6));
    }

    try {
      let result;

      if (state.keyword) {
        const items = await searchPlatforms(state.keyword);
        result = { items, hasMore: false };
      } else if (state.filter === 'all') {
        result = await loadAll(state.page);
      } else if (state.filter === 'movie') {
        result = await loadMovie(state.page);
      } else {
        result = await loadSerial(state.page);
      }

      state.items = reset ? result.items : [...state.items, ...result.items];
      state.hasMore = result.hasMore;
      renderGrid();
      loadMoreBtn.hidden = !state.hasMore || Boolean(state.keyword);
      loadMoreBtn.disabled = false;
      D.motion?.hideProgress?.();
      if (reset) D.motion?.staggerGrid?.(grid);
    } catch (e) {
      D.motion?.hideProgress?.();
      loadMoreBtn.disabled = false;
      const message = e.message || D.friendlyError?.() || 'Gagal memuat konten.';
      D.toast?.error?.(message);
      grid.innerHTML = D.buildErrorState(message, { retryId: 'discover' });
      grid.querySelectorAll('[data-retry-section]').forEach((btn) => {
        btn.addEventListener('click', () => load(true));
      });
    }
  }

  // ── Filter button ──────────────────────────────────────────────
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      D.openSheet({
        title: D.t('discover.cat_title'),
        current: state.filter,
        items: categoryItems(),
        onPick: (id) => {
          state.filter = id;
          D.Store.set(D.STORAGE.DISCOVER_CAT, id);
          syncFilterBtn();
          load(true);
        },
      });
    });
  }

  function syncFilterBtn() {
    if (!filterBtn) return;
    const active = state.filter !== 'all';
    filterBtn.style.borderColor = active ? 'var(--accent)' : 'var(--border-muted)';
    filterBtn.style.color = active ? 'var(--accent)' : 'var(--text-secondary)';
  }

  // ── Search ─────────────────────────────────────────────────────
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const val = searchInput.value.trim();
      searchClear.hidden = !val;
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(() => {
        state.keyword = val;
        load(true);
      }, 400);
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.hidden = true;
      state.keyword = '';
      searchInput.focus();
      load(true);
    });
  }

  // ── Load more ──────────────────────────────────────────────────
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      state.page += 1;
      load(false);
    });
  }

  // ── Events ─────────────────────────────────────────────────────
  document.addEventListener('lang:changed', () => {
    syncFilterBtn();
    load(true);
  });

  // ── Init ───────────────────────────────────────────────────────
  if (storedFilter === 'shorts') D.Store.set(D.STORAGE.DISCOVER_CAT, 'all');
  syncFilterBtn();
  load(true);
})();
