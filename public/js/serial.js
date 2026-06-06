/* Serial page · catalog with hero slider. */
(function () {
  const D = window.DramSi;

  const heroTrack = document.getElementById('serialHeroTrack');
  const heroDots = document.getElementById('serialHeroDots');
  const searchForm = document.getElementById('serialSearchForm');
  const searchInput = document.getElementById('serialSearchInput');
  const searchClear = document.getElementById('serialSearchClear');
  const yearFilter = document.getElementById('serialYearFilter');
  const yearLabel = document.getElementById('serialYearLabel');
  const filterReset = document.getElementById('serialFilterReset');
  const trendingRail = document.getElementById('serialTrendingRail');
  const newRail = document.getElementById('serialNewRail');
  const forYouGrid = document.getElementById('serialForYouGrid');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const state = { page: 1, items: [], keyword: '', year: '', filterYears: [], availableYears: [], heroSeed: Math.random() };
  let platform = 'kdrama';
  let heroTimer = null;
  let heroIndex = 0;
  let heroSlides = [];
  let loadToken = 0;
  const heroDetailCache = new Map();

  // ── Tab switching ──────────────────────────────────────────────────────────
  const tabBtns = document.querySelectorAll('[data-serial-tab]');

  function setActiveTab(newPlatform) {
    platform = newPlatform;
    tabBtns.forEach((btn) => {
      const isActive = btn.dataset.serialTab === platform;
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
    // Reset search & filters when switching platform
    searchInput.value = '';
    state.keyword = '';
    searchClear.hidden = true;
    state.year = '';
    state.filterYears = [];
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.serialTab === platform) return;
      setActiveTab(btn.dataset.serialTab);
      heroDetailCache.clear();
      loadFilters();
      load(true);
    });
  });
  // ──────────────────────────────────────────────────────────────────────────
  const minFilterYear = 2022;

  function synopsisOf(item) {
    return item?.synopsis || item?.description || item?.introduction || item?.summary || '';
  }

  function hasSliderSynopsis(item) {
    const synopsis = synopsisOf(item).trim();
    if (!synopsis) return true; // Allow items without synopsis — will be enriched later
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

  function applySerialTranslations() {
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
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
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

  function filterItems(items) {
    return items.filter((item) => {
      const yearOk = !state.year || getItemYear(item) === state.year;
      return yearOk;
    });
  }

  function syncFilterOptions() {
    const fallbackYears = state.items.map(getItemYear).filter(Boolean);
    const years = validFilterYears([...(state.filterYears || []), ...fallbackYears]);

    if (state.year && !years.includes(state.year)) state.year = '';
    state.availableYears = years;

    if (yearLabel) yearLabel.textContent = state.year || D.t('serial.filter_year_all');
    if (yearFilter) {
      yearFilter.style.color = state.year ? 'var(--accent)' : 'var(--text-secondary)';
      yearFilter.style.borderColor = state.year ? 'var(--accent)' : 'var(--border-muted)';
      yearFilter.setAttribute('aria-label', state.year ? `Filter tahun ${state.year}` : D.t('serial.filter_year_all'));
      yearFilter.dataset.tooltip = state.year || D.t('serial.filter_year_all');
    }
    if (filterReset) filterReset.hidden = !state.year;
  }

  function openYearSheet() {
    if (!D.openSheet) return;
    D.openSheet({
      title: D.t('serial.filter_year_all'),
      current: state.year,
      items: [
        { value: '', label: D.t('serial.filter_year_all') },
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
      container.innerHTML = `<div class="text-sm text-white/45 px-2">${D.t('serial.empty_data')}</div>`;
      return;
    }
    container.innerHTML = items.map((it, i) => D.buildPoster(it, platform, {
      ...(opts.ranked ? { rank: i + 1 } : {}),
    })).join('');
    window.refreshIcons?.();
  }

  function renderGrid(container, items) {
    if (!items.length) {
      container.innerHTML = emptyMessage(D.t('serial.empty'));
      return;
    }
    container.innerHTML = items.map((it) => D.buildPoster(it, platform)).join('');
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

  // Stable shuffle: urutan tetap sama selama session
  function stableShuffle(items) {
    return [...(items || [])].sort((a, b) => {
      const hashA = String(a.id || '').split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
      const hashB = String(b.id || '').split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
      return hashA - hashB;
    });
  }

  function shuffle(arr) {
    const pool = [...arr];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }

  function renderSections(items) {
    const visibleItems = filterItems(items);

    if (state.keyword) {
      renderRail(trendingRail, visibleItems.slice(0, 12), { ranked: true });
      renderRail(newRail, []);
      renderGrid(forYouGrid, visibleItems.slice(12));
      return;
    }

    // Trending: sort by popularity
    const trending = sortByPopularity(visibleItems).slice(0, 12);
    const trendingIds = new Set(trending.map((it) => it.id));

    // New Release: dari sisa item, sort by tahun terbaru
    const remaining = visibleItems.filter((it) => !trendingIds.has(it.id));
    const newRelease = sortByNewest(remaining).slice(0, 12);
    const newReleaseIds = new Set(newRelease.map((it) => it.id));

    // For You: sisa item, stable shuffle (urutan konsisten)
    const forYou = stableShuffle(remaining.filter((it) => !newReleaseIds.has(it.id)));

    renderRail(trendingRail, trending, { ranked: true });
    renderRail(newRail, newRelease.length ? newRelease : sortByNewest(visibleItems).slice(0, 12));
    renderGrid(forYouGrid, forYou.length ? forYou : stableShuffle(visibleItems));
  }

  function setLoading() {
    trendingRail.innerHTML = D.buildSkeletons(8);
    newRail.innerHTML = D.buildSkeletons(8);
    forYouGrid.innerHTML = D.buildSkeletons(12);
  }

  function moveHero(idx) {
    if (!heroSlides.length) return;
    const prevIndex = heroIndex;
    heroIndex = (idx + heroSlides.length) % heroSlides.length;
    if (prevIndex === heroIndex) return;

    const slides = heroTrack.querySelectorAll('.home-hero-slide');
    slides.forEach((slide, i) => {
      slide.classList.remove('is-active', 'is-prev');
      if (i === heroIndex) {
        slide.classList.add('is-active');
      } else if (i === prevIndex) {
        slide.classList.add('is-prev');
      }
    });

    heroDots.querySelectorAll('.hero-dot').forEach((dot, i) => {
      const active = i === heroIndex;
      dot.style.width = active ? '28px' : '8px';
      dot.style.background = active ? '#1ed760' : 'rgba(255,255,255,0.38)';
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

  /**
   * Enrich hanya item yang akan tampil di hero slider (max 5).
   * Ini jauh lebih hemat kuota dibanding enrich semua 60 item.
   */
  async function enrichHeroItems(heroItems) {
    const enriched = await Promise.all(heroItems.map(async (item) => {
      try {
        if (heroDetailCache.has(item.id)) return heroDetailCache.get(item.id);
        const res = await D.Platforms[platform].detail(item.id);
        const raw = D.unwrap(res) || {};
        const drama = raw.data || raw || {};
        const count = Number(drama.totalEpisodes || (Array.isArray(drama.episodes) ? drama.episodes.length : 0) || item.episodes || 0);
        const details = drama.details || {};
        const result = {
          ...item,
          cover: drama.cover || item.cover,
          banner: drama.banner || drama.cover || item.banner || item.cover,
          image: drama.image || drama.cover || item.image,
          synopsis: synopsisOf(drama) || synopsisOf(item),
          description: drama.description || drama.synopsis || item.description,
          episodes: count || item.episodes || 0,
          totalEpisodes: count || item.totalEpisodes || 0,
          year: drama.year || details.release_date?.match(/\d{4}/)?.[0] || item.year,
          genres: details.genres || drama.genres || item.genres || '',
          network: details.network || drama.network || item.network || '',
          country: details.country || drama.country || item.country || '',
        };
        heroDetailCache.set(item.id, result);
        return result;
      } catch (_) {
        return item;
      }
    }));
    return enriched;
  }

  function renderHero(items) {
    heroSlides = pickHeroItems(items, 5);
    if (!heroSlides.length) {
      heroTrack.innerHTML = '';
      heroDots.innerHTML = '';
      return;
    }

    // Preload gambar hero pertama sebelum render supaya tidak ada flash kosong
    const firstCover = heroSlides[0]?.banner || heroSlides[0]?.cover || heroSlides[0]?.image || '';
    const doRender = () => {
      heroTrack.innerHTML = heroSlides.map((it, i) => {
        const cover = D.heroImage ? D.heroImage(it) : (it.banner || it.detailCover || it.cover || it.image || D.placeholderImg(it.title));
        const synopsis = synopsisOf(it);
        const eps = D.episodeCount ? D.episodeCount(it) : Number(it.episodes || it.totalEpisodes || 0);
        const epsLabel = eps > 1 ? `${eps} ${D.t('common.episodes')}` : '';

        const dot = `<span style="width:3px;height:3px;border-radius:50%;background:#777;display:inline-block;flex-shrink:0;"></span>`;
        const metaHtml = [
          epsLabel ? `<span>${epsLabel}</span>` : '',
          it.network ? `<span>${escapeHtml(it.network)}</span>` : '',
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
                ${D.cleanTitle?.(it.title) || it.title || ''}
              </h2>
              <p class="home-hero-meta mt-1.5 flex flex-wrap items-center gap-x-2" style="color: #d7d7d7;">
                ${metaHtml || `<span>${D.Platforms[platform]?.label || 'Serial'}</span>`}
              </p>
              ${synopsis ? `<p class="home-hero-synopsis mt-3 line-clamp-2">${synopsis}</p>` : ''}
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
                style="width: ${i === 0 ? '28px' : '8px'}; background: ${i === 0 ? '#1ed760' : 'rgba(255,255,255,0.38)'};"></button>
      `).join('');

      heroDots.querySelectorAll('[data-hero-dot]').forEach((btn) => {
        btn.addEventListener('click', () => manualHeroMove(parseInt(btn.dataset.heroDot, 10)));
      });

      heroIndex = 0;

      startHeroAutoplay();
      window.refreshIcons?.();

      // Smart crop: sesuaikan object-position berdasarkan rasio gambar
      heroTrack.querySelectorAll('.home-hero-img').forEach((img) => {
        const applyCrop = () => {
          const ratio = img.naturalWidth / img.naturalHeight;
          if (ratio < 0.9) {
            img.style.objectPosition = 'center 15%';
          } else if (ratio < 1.4) {
            img.style.objectPosition = 'center 25%';
          } else {
            img.style.objectPosition = 'center 30%';
          }
        };
        if (img.complete && img.naturalWidth) applyCrop();
        else img.addEventListener('load', applyCrop, { once: true });
      });
    };

    // Preload cover image pertama supaya tidak ada flash putih
    if (firstCover && !firstCover.includes('placeholder')) {
      let rendered = false;
      const safeRender = () => { if (!rendered) { rendered = true; doRender(); } };
      const img = new Image();
      img.onload = safeRender;
      img.onerror = safeRender;
      img.src = firstCover;
      // Timeout fallback kalau image lambat
      setTimeout(safeRender, 2500);
    } else {
      doRender();
    }
  }

  async function load(reset = true) {
    const token = reset ? ++loadToken : loadToken;
    if (reset) {
      state.page = 1;
      state.items = [];
      state.heroSeed = Math.random();
      heroTrack.innerHTML = D.buildHeroSkeleton ? D.buildHeroSkeleton() : '';
      heroDots.innerHTML = '';
      setLoading();
      D.motion?.showProgress?.();
    } else {
      loadMoreBtn.disabled = true;
      forYouGrid.insertAdjacentHTML('beforeend', D.buildSkeletons(6));
    }

    try {
      const filters = { year: state.year };
      const res = state.keyword
        ? await D.Platforms[platform].search(state.keyword, filters)
        : await D.Platforms[platform].home(state.page, filters);
      const data = D.unwrap(res) || {};
      const items = data.items || [];
      state.items = reset ? items : [...state.items, ...items];

      // Render sections langsung dari data backend (tanpa enrich semua item)
      renderSections(state.items);
      syncFilterOptions();

      if (reset) {
        // Enrich hero items (max 5) untuk synopsis + cover yang lengkap
        // Render hero SEKALI setelah enrich selesai — hindari flash/double render
        const heroPool = pickHeroItems(state.items, 5);
        enrichHeroItems(heroPool).then((readyHero) => {
          if (token !== loadToken) return;
          renderHero(readyHero);
        });
      }

      loadMoreBtn.hidden = Boolean(state.keyword) || data.hasMore === false || items.length < 6;
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
      const message = e.message || D.friendlyError?.() || D.t('serial.load_error');
      D.toast?.error?.(message);
      heroTrack.innerHTML = '';
      heroDots.innerHTML = '';
      trendingRail.innerHTML = D.buildErrorState(message, { inline: true, retryId: 'serial' });
      newRail.innerHTML = D.buildErrorState(message, { inline: true, retryId: 'serial' });
      forYouGrid.innerHTML = D.buildErrorState(message, { retryId: 'serial' });
      forYouGrid.querySelectorAll('[data-retry-section]').forEach((btn) => {
        btn.addEventListener('click', () => load(true));
      });
      trendingRail.querySelectorAll('[data-retry-section]').forEach((btn) => {
        btn.addEventListener('click', () => load(true));
      });
      newRail.querySelectorAll('[data-retry-section]').forEach((btn) => {
        btn.addEventListener('click', () => load(true));
      });
    }
  }

  loadMoreBtn.addEventListener('click', () => {
    state.page += 1;
    load(false);
  });

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.keyword = searchInput.value.trim();
    searchClear.hidden = !state.keyword;
    load(true);
  });

  searchInput.addEventListener('input', () => {
    searchClear.hidden = !searchInput.value.trim();
    if (!searchInput.value.trim() && state.keyword) {
      state.keyword = '';
      load(true);
    }
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    state.keyword = '';
    searchClear.hidden = true;
    searchInput.focus();
    load(true);
  });

  yearFilter?.addEventListener('click', openYearSheet);

  filterReset?.addEventListener('click', () => {
    state.year = '';
    syncFilterOptions();
    load(true);
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
    applySerialTranslations();
    syncFilterOptions();
    renderHero(state.items);
    renderSections(state.items);
  });

  applySerialTranslations();
  loadFilters();
  load(true);
  window.refreshIcons?.();
})();
