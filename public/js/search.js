/* Search page · platform-aware search with debounce + clear button. */
(function () {
  const D = window.DramSi;

  const form = document.getElementById('searchForm');
  const input = document.getElementById('searchInput');
  const grid = document.getElementById('searchGrid');
  const hint = document.getElementById('searchHint');
  const platformBtn = document.getElementById('searchPlatformBtn');
  const clearBtn = document.getElementById('clearSearchBtn');

  const state = { platform: 'all', keyword: '' };
  let debounceId = null;

  function escapeHTML(value) {
    return String(value || '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[ch]));
  }

  const urlParams = new URLSearchParams(location.search);
  if (urlParams.get('q')) input.value = urlParams.get('q');

  function syncClearBtn() {
    clearBtn.hidden = !input.value.trim();
  }

  function platformItems() {
    return [
      { value: 'all', label: D.t('search.all_platforms'), sub: D.t('search.all_platforms_sub') },
      ...D.ALL_PLATFORMS.map((p) => ({
        value: p.id,
        label: p.label,
        sub: p.disabled ? 'Maintenance' : undefined,
      })),
    ];
  }

  async function searchOnePlatform(platform, keyword) {
    const res = await D.Platforms[platform].search(keyword);
    const data = D.unwrap(res) || {};
    return (data.items || []).map((item) => ({ item, platform }));
  }

  async function searchPlatforms(keyword) {
    if (state.platform !== 'all') {
      const p = D.ALL_PLATFORMS.find((x) => x.id === state.platform);
      if (p?.disabled) { D.toast?.info?.(`${p.label} sedang maintenance.`); return []; }
      return searchOnePlatform(state.platform, keyword);
    }

    const settled = await Promise.allSettled(
      D.PLATFORMS.map((p) => searchOnePlatform(p.id, keyword))
    );
    const results = settled
      .filter((result) => result.status === 'fulfilled')
      .flatMap((result) => result.value);

    if (!results.length && settled.every((result) => result.status === 'rejected')) {
      throw settled[0].reason;
    }
    return results;
  }

  async function doSearch(keyword) {
    syncClearBtn();
    if (!keyword || keyword.trim().length === 0) {
      state.keyword = '';
      grid.innerHTML = '';
      return;
    }
    state.keyword = keyword.trim();
    grid.innerHTML = D.buildSkeletons(12);
    D.motion?.showProgress?.();
    try {
      const results = await searchPlatforms(state.keyword);
      D.motion?.hideProgress?.();
      if (results.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full py-16 flex flex-col items-center text-center gap-3">
            <div class="search-empty-icon grid h-16 w-16 place-items-center rounded-2xl">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <p class="search-empty-title text-sm font-bold">${escapeHTML(D.t('search.empty_title', { keyword: state.keyword }))}</p>
            <p class="search-empty-subtitle text-xs">${D.t('search.empty_sub')}</p>
          </div>`;
      } else {
        grid.innerHTML = results.map(({ item, platform }) => D.buildPoster(item, platform)).join('');
        window.refreshIcons?.();
        D.motion?.staggerGrid?.(grid);
      }
    } catch (e) {
      D.motion?.hideProgress?.();
      const message = e.message || D.friendlyError?.() || 'Pencarian gagal.';
      D.toast?.error?.(message);
      grid.innerHTML = D.buildErrorState(message, { retryId: 'search' });
      grid.querySelectorAll('[data-retry-section]').forEach((btn) => {
        btn.addEventListener('click', () => doSearch(state.keyword));
      });
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    doSearch(input.value);
  });

  input.addEventListener('input', () => {
    clearTimeout(debounceId);
    debounceId = setTimeout(() => doSearch(input.value), 450);
    syncClearBtn();
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    syncClearBtn();
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
        if (id !== 'all') D.setPlatform(id);
        doSearch(state.keyword);
      },
    });
  });

  document.addEventListener('lang:changed', () => doSearch(state.keyword));
  document.addEventListener('platform:changed', (e) => {
    if (state.platform === 'all') return;
    state.platform = e.detail;
    doSearch(state.keyword);
  });

  if (input.value.trim()) doSearch(input.value);
  syncClearBtn();
})();
