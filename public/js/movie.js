/* Movie page · catalog with hero slider + full-catalog smart search. */
(function () {
  const D = window.Dramova;

  const heroTrack = document.getElementById('movieHeroTrack');
  const heroDots = document.getElementById('movieHeroDots');
  const searchForm = document.getElementById('movieSearchForm');
  const searchInput = document.getElementById('movieSearchInput');
  const searchClear = document.getElementById('movieSearchClear');
  const yearFilter = document.getElementById('movieYearFilter');
  const yearLabel = document.getElementById('movieYearLabel');
  const filterReset = document.getElementById('movieFilterReset');
  const trendingRail = document.getElementById('movieTrendingRail');
  const newRail = document.getElementById('movieNewRail');
  const forYouGrid = document.getElementById('movieForYouGrid');
  const loadMoreBtn = document.getElementById('loadMoreBtn');

  const state = {
    page: 1,
    items: [],       // catalog normal (non-search)
    keyword: '',
    year: '',
    filterYears: [],
    availableYears: [],
    hasMore: true,
    heroSeed: Math.random(),
    heroItems: [],
    visibleForYou: 16,
  };

  let platform = 'kmovie';
  let searchDebounceId = null;
  let heroTimer = null;
  let heroIndex = 0;
  let heroSlides = [];
  let heroRenderToken = 0;
  let loadToken = 0;
  const heroDetailCache = new Map();

  // ── Catalog cache — pakai shared prefetch cache ───────────────────────────
  function getCatalog(plat) {
    if (window.__DRAMOVA_PREFETCH__) return window.__DRAMOVA_PREFETCH__.getEntry(plat);
    if (!window.__DRAMOVA_CATALOG__) window.__DRAMOVA_CATALOG__ = {};
    if (!window.__DRAMOVA_CATALOG__[plat]) {
      window.__DRAMOVA_CATALOG__[plat] = { items: [], fullyLoaded: false, crawlPromise: null, listeners: [] };
    }
    return window.__DRAMOVA_CATALOG__[plat];
  }

  // ── Tab switching ──────────────────────────────────────────────────────────
  const tabBtns = document.querySelectorAll('[data-movie-tab]');

  function setActiveTab(newPlatform) {
    platform = newPlatform;
    tabBtns.forEach((btn) => {
      const isActive = btn.dataset.movieTab === platform;
      btn.setAttribute('aria-selected', String(isActive));
      if (isActive) {
        btn.style.background = 'var(--accent)';
        btn.style.color = 'var(--accent-control-text)';
        btn.style.borderColor = 'transparent';
      } else {
        btn.style.background = 'var(--bg-raised)';
        btn.style.color = 'var(--text-secondary)';
        btn.style.borderColor = 'var(--border-muted)';
      }
    });
    searchInput.value = '';
    state.keyword = '';
    searchClear.hidden = true;
    state.year = '';
    state.filterYears = [];
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.movieTab === platform) return;
      clearTimeout(searchDebounceId);
      setActiveTab(btn.dataset.movieTab);
      heroDetailCache.clear();
      loadFilters();
      load(true);
    });
  });
  // ──────────────────────────────────────────────────────────────────────────

  const minFilterYear = 2022;
  const MAX_CRAWL_PAGES = 20; // batas crawl semua halaman supaya tidak overload

  function synopsisOf(item) {
    return item?.synopsis || item?.description || item?.introduction || item?.summary || '';
  }

  function hasHeroImage(item) {
    return Boolean(item?.banner || item?.detailCover || item?.cover || item?.image);
  }

  function hasHeroMeta(item) {
    return Boolean(getItemYear(item) || item?.country);
  }

  function isHeroReady(item) {
    return Boolean(item?.id && item?.title && hasHeroImage(item) && synopsisOf(item).trim() && hasHeroMeta(item));
  }

  function hasSliderSynopsis(item) {
    const synopsis = synopsisOf(item).trim();
    if (!synopsis) return true;
    if (synopsis.length < 120) return false;
    return !/^(?:drama korea pilihan|intrik dan misteri seputar|kisah cinta|cerita menarik)\b/i.test(synopsis);
  }

  function pickHeroItems(items, limit = 5) {
    const pool = [...(items || []).filter(hasSliderSynopsis)];
    if (pool.length > limit) {
      const offset = Math.floor(state.heroSeed * pool.length) % pool.length;
      pool.push(...pool.splice(0, offset));
    }
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, limit);
  }

  function applymovieTranslations() {
    D.applyTranslations?.(document);
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = D.t(el.dataset.i18nPlaceholder);
    });
  }

  function emptyMessage(text) {
    return `<div class="col-span-full empty-state">${text}</div>`;
  }

  function normalizeText(value) {
    return String(value || '').trim();
  }

  function getItemYear(item) {
    const direct = normalizeText(item.year || item.releaseYear);
    if (/^(19|20)\d{2}$/.test(direct)) return direct;
    const titleMatch = normalizeText(item.title).match(/\b(19|20)\d{2}\b/);
    return titleMatch ? titleMatch[0] : '';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function validFilterYears(values) {
    const currentYear = new Date().getFullYear();
    const allowed = new Set(
      Array.from({ length: Math.max(0, currentYear - minFilterYear + 1) }, (_, i) => String(currentYear - i))
    );
    return [...new Set(values.map(normalizeText).filter((year) => allowed.has(year)))]
      .sort((a, b) => Number(b) - Number(a));
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

  function searchScore(item, queryTokens) {
    const title = normalizeQuery(item.title || '');
    const synopsis = normalizeQuery(synopsisOf(item));
    const queryStr = queryTokens.join(' ');

    if (title === queryStr) return 100;
    if (title.startsWith(queryStr)) return 80;
    if (title.includes(queryStr)) return 60;

    const titleTokens = tokenize(title);
    if (queryTokens.every((t) => titleTokens.some((tt) => tt.startsWith(t)))) return 50;
    if (queryTokens.some((t) => title.includes(t))) return 30;
    if (queryTokens.some((t) => synopsis.includes(t))) return 10;
    return 0;
  }

  function filterAndSearchItems(items) {
    if (!state.keyword) return filterItems(items);
    const queryTokens = tokenize(state.keyword);
    return items.filter((item) => {
      if (state.year && getItemYear(item) !== state.year) return false;
      return searchScore(item, queryTokens) > 0;
    });
  }

  function filterItems(items) {
    return items.filter((item) => !state.year || getItemYear(item) === state.year);
  }
  // ──────────────────────────────────────────────────────────────────────────

  // ── Full-catalog crawl — delegasi ke shared prefetch ──────────────────────
  function crawlFullCatalog(plat, onBatch) {
    if (window.__DRAMOVA_PREFETCH__) {
      if (onBatch) window.__DRAMOVA_PREFETCH__.subscribe(plat, (items, isDone) => onBatch(items, isDone));
      else window.__DRAMOVA_PREFETCH__.crawl(plat);
      return Promise.resolve();
    }
    // Fallback kalau prefetch belum siap
    const cat = getCatalog(plat);
    if (cat.fullyLoaded) { if (onBatch && cat.items.length > 0) onBatch(cat.items, true); return Promise.resolve(); }
    if (cat.crawlPromise) { return cat.crawlPromise.then(() => { if (onBatch) onBatch(cat.items, true); }); }
    const seenIds = new Set(cat.items.map((it) => it.id));
    cat.crawlPromise = (async () => {
      let page = 1;
      while (page <= MAX_CRAWL_PAGES) {
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
        if (gotNew && onBatch) onBatch(cat.items, false);
        if (!anyMore || !gotNew) break;
        page += 5;
      }
      cat.fullyLoaded = true;
      cat.crawlPromise = null;
      if (onBatch) onBatch(cat.items, true);
    })();
    return cat.crawlPromise;
  }
  // ──────────────────────────────────────────────────────────────────────────

  function syncFilterOptions() {
    const fallbackYears = state.items.map(getItemYear).filter(Boolean);
    const years = validFilterYears([...(state.filterYears || []), ...fallbackYears]);

    if (state.year && !years.includes(state.year)) state.year = '';
    state.availableYears = years;

    if (yearLabel) yearLabel.textContent = state.year || D.t('movie.filter_year_all');
    if (yearFilter) {
      yearFilter.style.color = state.year ? 'var(--accent)' : 'var(--text-secondary)';
      yearFilter.style.borderColor = state.year ? 'var(--accent)' : 'var(--border-muted)';
      yearFilter.setAttribute('aria-label', state.year ? `Filter tahun ${state.year}` : D.t('movie.filter_year_all'));
      yearFilter.dataset.tooltip = state.year || D.t('movie.filter_year_all');
    }
    if (filterReset) filterReset.hidden = !state.year;
  }

  function openYearSheet() {
    if (!D.openSheet) return;
    D.openSheet({
      title: D.t('movie.filter_year_all'),
      current: state.year,
      items: [
        { value: '', label: D.t('movie.filter_year_all') },
        ...state.availableYears.map((year) => ({ value: year, label: year })),
      ],
      onPick: (year) => {
        state.year = year;
        syncFilterOptions();
        load(true);
      },
    });
  }

  async function loadFilters() {
    try {
      const res = await D.Platforms[platform].filters?.();
      const data = D.unwrap(res) || {};
      state.filterYears = validFilterYears(data.years || []);
      syncFilterOptions();
    } catch (_) {
      syncFilterOptions();
    }
  }

  function renderRail(container, items, opts = {}) {
    if (!items.length) {
      container.innerHTML = `<div class="text-sm text-white/45 px-2">${D.t('movie.empty_data')}</div>`;
      return;
    }
    container.innerHTML = items.map((it, i) => D.buildPoster(it, platform, {
      ...(opts.ranked ? { rank: i + 1 } : {}),
    })).join('');
    window.refreshIcons?.();
  }

  function renderGrid(container, items, opts = {}) {
    if (!items.length) {
      if (!opts.append) container.innerHTML = emptyMessage(D.t('movie.empty'));
      return;
    }
    if (opts.append) {
      container.querySelectorAll('.poster-skeleton-card').forEach((s) => s.remove());
      const startIdx = container.children.length;
      const html = items.map((it) => D.buildPoster(it, platform)).join('');
      container.insertAdjacentHTML('beforeend', html);
      const children = container.children;
      for (let i = startIdx; i < children.length; i++) {
        children[i].style.opacity = '0';
        children[i].style.transform = 'translateY(16px)';
        children[i].style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        setTimeout(() => {
          children[i].style.opacity = '1';
          children[i].style.transform = 'translateY(0)';
        }, (i - startIdx) * 50);
      }
    } else {
      container.innerHTML = items.map((it) => D.buildPoster(it, platform)).join('');
    }
    window.refreshIcons?.();
  }

  function sortByPopularity(items) {
    return [...items].sort((a, b) => {
      const viewA = parseInt(a.viewCount || a.playCount || 0, 10) || 0;
      const viewB = parseInt(b.viewCount || b.playCount || 0, 10) || 0;
      if (viewB !== viewA) return viewB - viewA;
      const epsA = Number(a.episodes || a.totalEpisodes || 0);
      const epsB = Number(b.episodes || b.totalEpisodes || 0);
      return epsB - epsA;
    });
  }

  function sortByNewest(items) {
    return [...items].sort((a, b) => {
      const yearA = getItemYear(a);
      const yearB = getItemYear(b);
      if (yearA && yearB) return yearB.localeCompare(yearA);
      if (yearA && !yearB) return -1;
      if (!yearA && yearB) return 1;
      return 0;
    });
  }

  function stableShuffle(items) {
    return [...(items || [])].sort((a, b) => {
      const hashA = String(a.id || '').split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
      const hashB = String(b.id || '').split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
      return hashA - hashB;
    });
  }

  // ── Render search results dengan label progress ────────────────────────────
  function renderSearchSections(allItems, isDone) {
    const queryTokens = tokenize(state.keyword);
    const matched = allItems.filter((item) => {
      if (state.year && getItemYear(item) !== state.year) return false;
      return searchScore(item, queryTokens) > 0;
    });
    const ranked = [...matched].sort((a, b) => searchScore(b, queryTokens) - searchScore(a, queryTokens));

    const trendingHeader = document.querySelector('#movieTrendingSection .section-title');
    if (trendingHeader) {
      trendingHeader.textContent = D.t('movie.trending');
    }

    renderRail(trendingRail, ranked.slice(0, 10), { ranked: true });
    renderRail(newRail, []);
    renderGrid(forYouGrid, ranked.slice(12));
  }

  function renderSections(items) {
    if (state.keyword) {
      renderSearchSections(items, true);
      return;
    }

    // Reset header ke normal
    const trendingHeader = document.querySelector('#movieTrendingSection .section-title');
    if (trendingHeader && trendingHeader.dataset.i18n) {
      trendingHeader.textContent = D.t('movie.trending');
    }

    const visibleItems = filterItems(items);

    const trending = sortByPopularity(visibleItems).slice(0, 10);
    const trendingIds = new Set(trending.map((it) => it.id));

    const remaining = visibleItems.filter((it) => !trendingIds.has(it.id));
    const newRelease = sortByNewest(remaining).slice(0, 10);
    const newReleaseIds = new Set(newRelease.map((it) => it.id));

    const forYou = stableShuffle(remaining.filter((it) => !newReleaseIds.has(it.id)));

    renderRail(trendingRail, trending, { ranked: true });
    renderRail(newRail, newRelease.length ? newRelease : sortByNewest(visibleItems).slice(0, 10));
    const prevCount = forYouGrid.children.length;
    const forYouItems = forYou.length
      ? forYou.slice(0, state.visibleForYou)
      : stableShuffle(visibleItems).slice(0, state.visibleForYou);
    
    if (prevCount > 0 && forYouItems.length > prevCount) {
      const newItems = forYouItems.slice(prevCount);
      renderGrid(forYouGrid, newItems, { append: true });
    } else if (prevCount === 0 || forYouItems.length <= prevCount) {
      renderGrid(forYouGrid, forYouItems);
    }
  }

  function setLoading() {
    trendingRail.innerHTML = D.buildSkeletons(8);
    newRail.innerHTML = D.buildSkeletons(8);
    forYouGrid.innerHTML = D.buildSkeletons(16);
  }

  // ── Hero ──────────────────────────────────────────────────────────────────
  function moveHero(idx) {
    if (!heroSlides.length) return;
    const prevIndex = heroIndex;
    heroIndex = (idx + heroSlides.length) % heroSlides.length;
    if (prevIndex === heroIndex) return;

    const slides = heroTrack.querySelectorAll('.home-hero-slide');
    slides.forEach((slide, i) => {
      slide.classList.remove('is-active', 'is-prev');
      if (i === heroIndex) slide.classList.add('is-active');
      else if (i === prevIndex) slide.classList.add('is-prev');
    });

    heroDots.querySelectorAll('.hero-dot').forEach((dot, i) => {
      const active = i === heroIndex;
      dot.style.width = active ? '28px' : '8px';
      dot.style.background = active ? '#2BA641' : 'rgba(255,255,255,0.38)';
      dot.classList.toggle('is-active', active);
    });
  }

  function startHeroAutoplay() {
    clearInterval(heroTimer);
    if (heroSlides.length < 2) return;
    heroTimer = setInterval(() => moveHero(heroIndex + 1), 6500);
  }

  function manualHeroMove(idx) {
    moveHero(idx);
    startHeroAutoplay();
  }

  async function enrichHeroItems(heroItems) {
    const enriched = await Promise.all(heroItems.map(async (item) => {
      try {
        if (heroDetailCache.has(item.id)) return heroDetailCache.get(item.id);
        const res = await D.Platforms[platform].detail(item.id);
        const raw = D.unwrap(res) || {};
        const drama = raw.data || raw || {};
        const count = Number(drama.totalEpisodes || (Array.isArray(drama.episodes) ? drama.episodes.length : 0) || item.episodes || 0);
        const details = drama.details || {};
        const releaseYear = drama.year || details.release_date?.match(/\d{4}/)?.[0] || item.year;
        const network = details.network || drama.network || item.network || '';
        const country = details.country || drama.country || item.country || '';
        const result = {
          ...item,
          title: drama.title || item.title,
          cover: drama.cover || item.cover,
          banner: drama.banner || drama.cover || item.banner || item.cover,
          image: drama.image || drama.cover || item.image,
          synopsis: synopsisOf(drama) || synopsisOf(item),
          description: drama.description || drama.synopsis || item.description,
          episodes: count || item.episodes || 0,
          totalEpisodes: count || item.totalEpisodes || 0,
          year: releaseYear,
          genres: details.genres || drama.genres || item.genres || '',
          network: Array.isArray(network) ? network.join(', ') : network,
          country: Array.isArray(country) ? country.join(', ') : country,
        };
        heroDetailCache.set(item.id, result);
        return result;
      } catch (_) {
        return item;
      }
    }));
    return enriched;
  }

  function readyHeroItems(items) {
    const ready = (items || []).filter(isHeroReady);
    return ready;
  }

  function heroTitleHtml(item) {
    const title = D.cleanTitle?.(item.title) || item.title || '';
    return title
      ? escapeHtml(title)
      : '<span class="home-hero-info-skeleton home-hero-title-skeleton skeleton"></span>';
  }

  function heroMetaHtml(html) {
    return html || '<span class="home-hero-info-skeleton home-hero-meta-skeleton skeleton"></span>';
  }

  function heroSynopsisHtml(synopsis) {
    return synopsis
      ? `<p class="home-hero-synopsis mt-3 line-clamp-2">${escapeHtml(synopsis)}</p>`
      : '<div class="home-hero-info-skeleton home-hero-synopsis-skeleton skeleton"></div><div class="home-hero-info-skeleton home-hero-synopsis-skeleton skeleton"></div>';
  }

  function renderHero(items) {
    const renderToken = ++heroRenderToken;
    heroSlides = pickHeroItems(items, 5);
    if (!heroSlides.length) {
      heroTrack.innerHTML = D.buildHeroSkeleton ? D.buildHeroSkeleton() : '';
      heroDots.innerHTML = '';
      return;
    }

    const firstCover = heroSlides[0]?.banner || heroSlides[0]?.cover || heroSlides[0]?.image || '';
    const doRender = () => {
      if (renderToken !== heroRenderToken) return;
      heroTrack.innerHTML = heroSlides.map((it, i) => {
        const cover = D.heroImage ? D.heroImage(it) : (it.banner || it.detailCover || it.cover || it.image || D.placeholderImg(it.title));
        const synopsis = synopsisOf(it);
        const dot = `<span style="width:3px;height:3px;border-radius:50%;background:#777;display:inline-block;flex-shrink:0;"></span>`;
        const metaHtml = [
          it.year ? `<span>${escapeHtml(it.year)}</span>` : '',
          it.country ? `<span>${escapeHtml(it.country)}</span>` : '',
        ].filter(Boolean).join(dot);
        const activeClass = i === 0 ? 'is-active' : '';
        const loadAttr = i === 0 ? 'eager' : 'lazy';
        return `
          <div class="home-hero-slide hero-slide block w-full shrink-0 overflow-hidden ${activeClass}">
            <img src="${cover}" alt="${it.title || ''}"
                 loading="${loadAttr}"${i === 0 ? ' fetchpriority="high"' : ''}
                 onerror="this.src='${D.placeholderImg(it.title)}'"
                 class="home-hero-img absolute inset-0 h-full w-full object-cover" />
            <div class="hero-gradient absolute inset-0"></div>
            <div class="home-hero-copy absolute z-[2]">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold text-white"
                    style="background: rgba(18,18,18,0.62); border: 1px solid rgba(255,255,255,0.16); border-radius: 9999px; letter-spacing: 0.8px; backdrop-filter: blur(8px);">
                <i data-lucide="clapperboard" class="h-3 w-3" style="color:rgba(255,255,255,0.78);"></i>
                <span style="color:rgba(255,255,255,0.88);">${D.Platforms[platform]?.label || platform}</span>
              </span>
              <h2 class="home-hero-title mt-2.5 text-white">
                ${heroTitleHtml(it)}
              </h2>
              <p class="home-hero-meta mt-1.5 flex flex-wrap items-center gap-x-2" style="color: #d7d7d7;">
                ${heroMetaHtml(metaHtml)}
              </p>
              ${heroSynopsisHtml(synopsis)}
              <span data-watch-href="${D.watchUrl(platform, it.id)}" class="hero-cta-watch mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold sm:mt-4 sm:px-5 sm:py-2.5 sm:text-sm"
                    style="border-radius: 9999px; background: var(--accent-control-bg); color: var(--accent-control-text); border: 1px solid var(--accent-control-border); letter-spacing: 1.4px; text-transform: uppercase; box-shadow: rgba(0,0,0,0.5) 0px 8px 24px; cursor: pointer; position: relative; z-index: 5;">
                <i data-lucide="play" class="h-3.5 w-3.5 fill-current"></i>${D.t('common.watch_now')}
              </span>
            </div>
          </div>`;
      }).join('');

      heroDots.innerHTML = heroSlides.map((_, i) => `
        <button type="button" class="hero-dot hero-dot-btn ${i === 0 ? 'is-active' : ''}"
                data-hero-dot="${i}" aria-label="Buka slide ${i + 1}"
                style="width: ${i === 0 ? '28px' : '8px'}; background: ${i === 0 ? '#2BA641' : 'rgba(255,255,255,0.38)'};"></button>
      `).join('');

      heroDots.querySelectorAll('[data-hero-dot]').forEach((btn) => {
        btn.addEventListener('click', () => manualHeroMove(parseInt(btn.dataset.heroDot, 10)));
      });

      heroIndex = 0;
      startHeroAutoplay();
      window.refreshIcons?.();

      heroTrack.querySelectorAll('.home-hero-img').forEach((img) => {
        const applyCrop = () => {
          const ratio = img.naturalWidth / img.naturalHeight;
          if (ratio < 0.9) img.style.objectPosition = 'center 15%';
          else if (ratio < 1.4) img.style.objectPosition = 'center 25%';
          else img.style.objectPosition = 'center 30%';
        };
        if (img.complete && img.naturalWidth) applyCrop();
        else img.addEventListener('load', applyCrop, { once: true });
      });
    };

    if (firstCover) {
      const img = new Image();
      img.onload = doRender;
      img.onerror = doRender;
      img.src = firstCover;
    } else {
      doRender();
    }
  }

  // ── Normal load (catalog biasa, bukan search) ──────────────────────────────
  async function load(reset = true) {
    const token = reset ? ++loadToken : loadToken;
    if (reset) {
      state.page = 1;
      state.items = [];
      state.heroSeed = Math.random();
      state.hasMore = true;
      heroTrack.innerHTML = D.buildHeroSkeleton ? D.buildHeroSkeleton() : '';
      heroDots.innerHTML = '';
      state.visibleForYou = 16;
      setLoading();
      D.motion?.showProgress?.();
    } else {
      loadMoreBtn.disabled = true;
      forYouGrid.insertAdjacentHTML('beforeend', D.buildSkeletons(16));
    }

    try {
      const filters = { year: state.year };
      const res = await D.Platforms[platform].home(state.page, filters);
      const data = D.unwrap(res) || {};
      const items = data.items || [];
      state.items = reset ? items : [...state.items, ...items];

      // Sync ke catalogCache
      const cat = getCatalog(platform);
      if (reset) {
        const seenIds = new Set(items.map((it) => it.id));
        cat.items = [...items];
        // Tambahkan item cache yang belum ada
        for (const it of (cat.items || [])) {
          if (!seenIds.has(it.id)) { seenIds.add(it.id); cat.items.push(it); }
        }
      } else {
        const seenIds = new Set(cat.items.map((it) => it.id));
        items.forEach((it) => { if (!seenIds.has(it.id)) cat.items.push(it); });
      }

      renderSections(state.items);
      syncFilterOptions();

      if (reset) {
        state.heroItems = [];
        const heroPool = pickHeroItems(state.items, 12);
        enrichHeroItems(heroPool).then((readyHero) => {
          if (token !== loadToken) return;
          state.heroItems = readyHeroItems(readyHero);
          renderHero(state.heroItems);
        });

        // Mulai crawl background supaya data lengkap untuk search berikutnya
        crawlFullCatalog(platform, null);
      }

      state.hasMore = data.hasMore !== false;
      loadMoreBtn.hidden = Boolean(state.keyword) || (!state.hasMore && items.length < 6);
      loadMoreBtn.disabled = false;
      D.motion?.hideProgress?.();
      if (reset) {
        D.motion?.staggerGrid?.(trendingRail, 0.1);
        D.motion?.staggerGrid?.(newRail, 0.15);
        D.motion?.staggerGrid?.(forYouGrid, 0.2);
      }
    } catch (e) {
      D.motion?.hideProgress?.();
      loadMoreBtn.disabled = false;
      const message = e.message || D.friendlyError?.() || D.t('movie.load_error');
      D.toast?.error?.(message);
      heroTrack.innerHTML = '';
      heroDots.innerHTML = '';
      trendingRail.innerHTML = D.buildErrorState(message, { inline: true, retryId: 'movie' });
      newRail.innerHTML = D.buildErrorState(message, { inline: true, retryId: 'movie' });
      forYouGrid.innerHTML = D.buildErrorState(message, { retryId: 'movie' });
      [trendingRail, newRail, forYouGrid].forEach((el) => {
        el.querySelectorAll('[data-retry-section]').forEach((btn) => {
          btn.addEventListener('click', () => load(true));
        });
      });
    }
  }

  // ── Search: streaming dari full catalog ────────────────────────────────────
  let searchToken = 0;

  function doSearch(kw) {
    const token = ++searchToken;
    state.keyword = kw;
    searchClear.hidden = !kw;
    loadMoreBtn.hidden = true;

    if (!kw) {
      // Reset header section
      const trendingHeader = document.querySelector('#movieTrendingSection .section-title');
      if (trendingHeader) trendingHeader.textContent = D.t('movie.trending');
      renderSections(state.items);
      return;
    }

    // Tampilkan hasil dari data yang sudah ada dulu (instan)
    const cat = getCatalog(platform);
    const initialPool = cat.items.length > 0 ? cat.items : state.items;
    if (initialPool.length > 0) {
      renderSearchSections(initialPool, cat.fullyLoaded);
    } else {
      trendingRail.innerHTML = D.buildSkeletons(8);
      newRail.innerHTML = `<div class="text-sm text-white/45 px-2"></div>`;
      forYouGrid.innerHTML = D.buildSkeletons(16);
    }

    // Kalau catalog belum penuh, crawl sambil update UI secara realtime
    if (!cat.fullyLoaded) {
      crawlFullCatalog(platform, (allItems, isDone) => {
        if (token !== searchToken) return; // user sudah ganti keyword
        if (!state.keyword) return;
        renderSearchSections(allItems, isDone);
      });
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  loadMoreBtn.addEventListener('click', () => {
    const forYouStart = state.items.length > 24 ? 24 : 0;
    const hasHiddenLocalItems = state.items.length > forYouStart + state.visibleForYou;
    state.visibleForYou += 16;
    if (hasHiddenLocalItems) {
      renderSections(state.items);
      loadMoreBtn.hidden = Boolean(state.keyword) || (!state.hasMore && state.items.length <= forYouStart + state.visibleForYou);
      return;
    }
    state.page += 1;
    load(false);
  });

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(searchDebounceId);
    doSearch(searchInput.value.trim());
  });

  searchInput.addEventListener('input', () => {
    const kw = searchInput.value.trim();
    searchClear.hidden = !kw;
    clearTimeout(searchDebounceId);

    if (!kw) {
      doSearch('');
      return;
    }

    // Render lokal instan sebelum debounce selesai
    const cat = getCatalog(platform);
    const pool = cat.items.length > 0 ? cat.items : state.items;
    if (pool.length > 0) {
      state.keyword = kw;
      renderSearchSections(pool, cat.fullyLoaded);
    }

    searchDebounceId = setTimeout(() => doSearch(kw), 350);
  });

  searchClear.addEventListener('click', () => {
    clearTimeout(searchDebounceId);
    searchInput.value = '';
    doSearch('');
    searchInput.focus();
  });

  yearFilter?.addEventListener('click', openYearSheet);

  filterReset?.addEventListener('click', () => {
    state.year = '';
    syncFilterOptions();
    if (state.keyword) doSearch(state.keyword);
    else load(true);
  });

  heroTrack.addEventListener('touchstart', () => clearInterval(heroTimer), { passive: true });
  heroTrack.addEventListener('touchend', startHeroAutoplay, { passive: true });
  heroTrack.addEventListener('touchcancel', startHeroAutoplay, { passive: true });

  let touchStartX = 0;
  let touchStartY = 0;
  heroTrack.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  heroTrack.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) manualHeroMove(heroIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });

  document.addEventListener('lang:changed', () => {
    applymovieTranslations();
    syncFilterOptions();
    renderHero(state.heroItems.length ? state.heroItems : state.items);
    renderSections(state.items);
  });

  applymovieTranslations();
  loadFilters();
  load(true);
  window.refreshIcons?.();
})();

