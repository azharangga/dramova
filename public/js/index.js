/* =====================================================================
   Home page · hero carousel + horizontal rails per category.
   ===================================================================== */
(function () {
  const D = window.DramSi;

  const heroTrack = document.getElementById('heroTrack');
  const heroDots = document.getElementById('heroDots');
  const trendingRail = document.getElementById('trendingRail');
  const newReleaseRail = document.getElementById('newReleaseRail');
  const forYouGrid = document.getElementById('forYouGrid');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const homePlatformBtn = document.getElementById('homeCategoryBtn');
  const homePlatformLabel = document.getElementById('homeCategoryLabel');

  let heroTimer = null;
  let heroIndex = 0;
  let heroSlides = [];
  const SERIAL_PLATFORM = 'kdrama';
  const state = {
    platform: D.Store.get(D.STORAGE.HOME_CAT, 'all') || 'all',
    page: 1,
    items: [],
    sectionItems: null,
    hasMore: true,
    visibleForYou: 6,
  };
  const detailCache = new Map();

  function syncPlatformButton(platform = state.platform) {
    if (!homePlatformLabel) return;
    const labels = { all: D.t('discover.cat_all'), shorts: 'Shorts', serial: 'Serial' };
    homePlatformLabel.textContent = labels[platform] || D.t('discover.cat_all');
  }

  function platformItems() {
    return [
      { value: 'all', label: D.t('discover.cat_all') },
      { value: 'shorts', label: 'Shorts', sub: D.t('discover.cat_shorts_sub') },
      { value: 'serial', label: 'Serial', sub: D.t('discover.cat_serial_sub') },
    ];
  }

  function withPlatform(item, platform) {
    return { ...(item || {}), __platform: item?.__platform || platform };
  }

  function shuffle(items) {
    const pool = [...(items || [])];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }

  // Stable shuffle: urutan tetap sama selama session (tidak berubah tiap render)
  function stableShuffle(items) {
    return [...(items || [])].sort((a, b) => {
      const hashA = String(a.id || '').split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
      const hashB = String(b.id || '').split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
      return hashA - hashB;
    });
  }

  function interleaveGroups(groups) {
    const queues = shuffle(groups.filter((group) => group.length).map((group) => [...group]));
    const mixed = [];

    while (queues.some((queue) => queue.length)) {
      shuffle(queues).forEach((queue) => {
        if (queue.length) mixed.push(queue.shift());
      });
    }

    return mixed;
  }

  function pickHeroItems(items, limit = 5) {
    const withSynopsis = (items || []).filter((item) => synopsisOf(item));
    const pool = withSynopsis.length ? withSynopsis : (items || []).slice(0, limit * 2);
    return shuffle(pool).slice(0, limit);
  }

  function episodeCount(item) {
    return D.episodeCount ? D.episodeCount(item) : 0;
  }

  function synopsisOf(item) {
    return item?.synopsis || item?.description || item?.introduction || item?.summary || '';
  }

  function mergeDetailItem(item, drama) {
    if (!drama) return item;
    const count = episodeCount(drama);
    const synopsis = synopsisOf(drama);
    return {
      ...item,
      cover: drama.cover || item.cover,
      image: drama.image || drama.cover || item.image,
      banner: drama.banner || drama.cover || item.banner,
      detailCover: drama.detailCover || drama.bookDetailCover || item.detailCover || '',
      synopsis: synopsis || synopsisOf(item),
      description: drama.description || drama.synopsis || item.description,
      totalEpisodes: count || item.totalEpisodes,
      episodeCount: count || item.episodeCount,
      episodes: Array.isArray(drama.episodes) ? drama.episodes : item.episodes,
      isCompleted: drama.isCompleted ?? item.isCompleted,
      year: drama.year || item.year,
    };
  }

  async function enrichVisibleItems(items, platform) {
    if (platform === 'all') return items;
    const detail = D.Platforms?.[platform]?.detail;
    if (!detail) return items;

    // Hanya enrich 5 item untuk hero slider (hemat kuota)
    const heroPool = pickHeroItems(items, 5);
    const heroIds = new Set(heroPool.map((it) => it.id));

    const enriched = await Promise.all(items.map(async (item) => {
      const needsDetail = !synopsisOf(item) && heroIds.has(item.id);
      if (!needsDetail || !item?.id) return item;

      try {
        const cacheKey = `${platform}:${item.id}`;
        let data = detailCache.get(cacheKey);
        if (!data) {
          const res = await detail(item.id);
          data = D.unwrap(res) || {};
          detailCache.set(cacheKey, data);
        }
        const drama = data.data || data.drama || data;
        return mergeDetailItem(item, drama);
      } catch (_) {
        return item;
      }
    }));

    return enriched;
  }

  function buildHero(items) {
    heroSlides = pickHeroItems(items, 5);
    if (heroSlides.length === 0) {
      heroTrack.innerHTML = '';
      heroDots.innerHTML = '';
      return;
    }

    heroTrack.innerHTML = heroSlides.map((it, i) => {
      const platform = it.__platform || state.platform;
      const platformLabel = (D.Platforms[platform] && D.Platforms[platform].label) || platform;
      const cover = D.heroImage ? D.heroImage(it) : (it.banner || it.detailCover || it.cover || it.image || D.placeholderImg(it.title));
      const eps = episodeCount(it);
      const epsLabel = eps > 0 && !(platform === 'kdrama' && eps <= 1) ? `${eps} ${D.t('common.episodes')}` : '';
      const choiceLabel = 'Drama pilihan.';
      const synopsis = synopsisOf(it);
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
            <!-- Platform badge -->
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold text-white"
                  style="background: rgba(18,18,18,0.62); border: 1px solid rgba(255,255,255,0.16); border-radius: 9999px; letter-spacing: 0.8px; backdrop-filter: blur(8px);">
              <i data-lucide="layers-2" class="h-3 w-3" style="color:rgba(255,255,255,0.78);"></i>
              <span style="color:rgba(255,255,255,0.88);">${platformLabel}</span>
            </span>
            <!-- Title -->
            <h3 class="home-hero-title mt-2.5 text-white">
              ${D.cleanTitle?.(it.title) || it.title || ''}
            </h3>
            <!-- Meta -->
            <p class="home-hero-meta mt-1.5 flex flex-wrap items-center gap-x-2" style="color: #d7d7d7;">
              ${epsLabel ? `<span>${epsLabel}</span><span style="width:3px;height:3px;border-radius:50%;background:#777;display:inline-block;"></span>` : ''}
              <span class="line-clamp-1" style="max-width: 50ch;">${choiceLabel}</span>
            </p>
            <p class="home-hero-synopsis mt-3 line-clamp-2">
              ${synopsis}
            </p>
            <!-- CTA — goes directly to watch -->
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
          // Portrait (poster) — fokus ke wajah di atas
          img.style.objectPosition = 'center 15%';
        } else if (ratio < 1.4) {
          // Mendekati square — fokus sedikit ke atas
          img.style.objectPosition = 'center 25%';
        } else {
          // Landscape (banner) — fokus ke tengah-atas
          img.style.objectPosition = 'center 30%';
        }
      };
      if (img.complete && img.naturalWidth) applyCrop();
      else img.addEventListener('load', applyCrop, { once: true });
    });
  }

  function moveHero(idx) {
    if (heroSlides.length === 0) return;
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

    // Update dots with progress animation
    heroDots.querySelectorAll('.hero-dot').forEach((d, i) => {
      const active = i === heroIndex;
      d.style.width      = active ? '28px' : '8px';
      d.style.background = active ? '#1ed760' : 'rgba(255,255,255,0.38)';
      d.classList.toggle('is-active', active);
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
    // Only trigger if horizontal swipe is dominant
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      manualHeroMove(heroIndex + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });

  function renderRail(container, items, platform, opts = {}) {
    if (!container) return;
    if (!items || items.length === 0) {
      container.innerHTML = `<div class="load-message px-2">${D.t('common.no_data')}</div>`;
      return;
    }
    container.innerHTML = items.map((it, i) => D.buildPoster(it, it.__platform || platform, opts.ranked ? { rank: i + 1 } : {})).join('');
    window.refreshIcons?.();
  }

  function renderGrid(container, items, platform) {
    if (!container) return;
    if (!items || items.length === 0) {
      container.innerHTML = `<div class="col-span-full empty-state">${D.t('common.no_data')}</div>`;
      return;
    }
    container.innerHTML = items.map((it) => D.buildPoster(it, it.__platform || platform)).join('');
    window.refreshIcons?.();
  }

  function setRailLoading(container, count = 6) {
    if (!container) return;
    container.innerHTML = D.buildSkeletons(count);
  }

  function sortByPopularity(items) {
    return [...items].sort((a, b) => {
      const viewA = parseInt(a.viewCount || a.playCount || 0, 10) || 0;
      const viewB = parseInt(b.viewCount || b.playCount || 0, 10) || 0;
      if (viewB !== viewA) return viewB - viewA;
      const ratingA = parseFloat(a.grade || a.ratings || 0) || 0;
      const ratingB = parseFloat(b.grade || b.ratings || 0) || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      // Fallback: lebih banyak episode = lebih populer (proxy untuk serial panjang)
      const epsA = Number(a.episodes || a.totalEpisodes || a.chapterCount || 0);
      const epsB = Number(b.episodes || b.totalEpisodes || b.chapterCount || 0);
      return epsB - epsA;
    });
  }

  function getItemYear(item) {
    // Cek field year langsung
    const direct = String(item.year || item.releaseYear || '').trim();
    if (/^(19|20)\d{2}$/.test(direct)) return direct;
    // Cek dari publishedAt/updatedAt
    const dateStr = item.publishedAt || item.updatedAt || '';
    if (dateStr) {
      const yearMatch = dateStr.match(/^(20\d{2})/);
      if (yearMatch) return yearMatch[1];
    }
    // Cek dari title
    const titleMatch = String(item.title || '').match(/\b(20\d{2})\b/);
    return titleMatch ? titleMatch[1] : '';
  }

  function sortByNewest(items) {
    return [...items].sort((a, b) => {
      // Prioritas 1: publishedAt/updatedAt (tanggal lengkap)
      const dateA = a.publishedAt || a.updatedAt || '';
      const dateB = b.publishedAt || b.updatedAt || '';
      if (dateA && dateB) return dateB.localeCompare(dateA);
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      // Prioritas 2: tahun dari field year atau title
      const yearA = getItemYear(a);
      const yearB = getItemYear(b);
      if (yearA && yearB) return yearB.localeCompare(yearA);
      if (yearA && !yearB) return -1;
      if (!yearA && yearB) return 1;
      return 0;
    });
  }

  function homeSections(items) {
    if (state.sectionItems) return state.sectionItems;

    // Trending: sort by viewCount/popularity, ambil top 12
    const trending = sortByPopularity(items).slice(0, 12);
    const trendingIds = new Set(trending.map((it) => it.id));

    // New Release: dari item yang belum masuk trending, sort by tanggal/tahun terbaru
    const remaining = items.filter((it) => !trendingIds.has(it.id));
    const newRelease = sortByNewest(remaining).slice(0, 12);
    const newReleaseIds = new Set(newRelease.map((it) => it.id));

    // For You: sisa item, stable shuffle (urutan konsisten per session)
    const forYou = stableShuffle(remaining.filter((it) => !newReleaseIds.has(it.id)));

    return {
      hero: items,
      trending,
      newRelease,
      forYou,
    };
  }

  function renderHomeSections(items, platform) {
    const sections = homeSections(items);

    buildHero(sections.hero);
    renderRail(trendingRail, sections.trending.slice(0, 12), platform, { ranked: true });
    renderRail(newReleaseRail, sections.newRelease.slice(0, 12), platform);

    const forYouItems = sections.forYou.length
      ? sections.forYou.slice(0, state.visibleForYou)
      : stableShuffle(items).slice(0, state.visibleForYou);
    renderGrid(forYouGrid, forYouItems, platform);

    // Fallback jika item terlalu sedikit untuk new release
    if (!state.sectionItems && sections.newRelease.length === 0) {
      renderRail(newReleaseRail, sortByNewest(items).slice(0, 12), platform);
    }

    D.motion?.staggerGrid?.(trendingRail, 0.1);
    D.motion?.staggerGrid?.(newReleaseRail, 0.15);
    D.motion?.staggerGrid?.(forYouGrid, 0.2);
  }

  function normalizeItems(data) {
    let items = data.items || [];
    if (data.sections && data.sections.length) {
      const allFromSections = data.sections.flatMap((s) => s.items || s.books || []);
      if (items.length === 0) items = allFromSections;
    }
    return items;
  }

  async function loadPlatformPage(platform, page) {
    const homeRes = await D.Platforms[platform].home(page);
    const data = D.unwrap(homeRes) || {};
    let items = normalizeItems(data).map((item) => withPlatform(item, platform));
    items = await enrichVisibleItems(items, platform);
    return { items, data };
  }

  function buildSectionItems(allItems) {
    const trending = sortByPopularity(allItems).slice(0, 12);
    const trendingIds = new Set(trending.map((it) => it.id));
    const remaining = allItems.filter((it) => !trendingIds.has(it.id));
    const newRelease = sortByNewest(remaining).slice(0, 12);
    const newReleaseIds = new Set(newRelease.map((it) => it.id));
    const forYou = stableShuffle(remaining.filter((it) => !newReleaseIds.has(it.id)));
    return {
      hero: allItems,
      trending,
      newRelease: newRelease.length ? newRelease : sortByNewest(allItems).slice(0, 12),
      forYou: forYou.length ? forYou : stableShuffle(allItems),
    };
  }

  async function loadHomeData(platform, page) {
    if (platform === 'serial') {
      const homeRes = await D.Platforms[SERIAL_PLATFORM].home(page);
      const data = D.unwrap(homeRes) || {};
      let items = (data.items || []).map((item) => withPlatform(item, SERIAL_PLATFORM));
      items = await enrichVisibleItems(items, SERIAL_PLATFORM);
      const sectionItems = buildSectionItems(items);
      return { items, sectionItems, data };
    }

    if (platform === 'shorts') {
      const settled = await Promise.allSettled(
        D.PLATFORMS.map((p) => loadPlatformPage(p.id, page))
      );
      const fulfilled = settled.filter((result) => result.status === 'fulfilled');
      if (!fulfilled.length) throw settled[0]?.reason || new Error('Konten gagal dimuat.');

      const allItems = interleaveGroups(fulfilled.map((result) => result.value.items));
      const sectionItems = buildSectionItems(allItems);
      const items = [...sectionItems.trending, ...sectionItems.newRelease, ...sectionItems.forYou];
      return {
        items, sectionItems,
        data: { hasMore: fulfilled.some((r) => r.value.data?.hasMore !== false && r.value.items.length >= 6) },
      };
    }

    // 'all' — mix shorts + serial
    const [shortsSettled, serialSettled] = await Promise.allSettled([
      Promise.allSettled(D.PLATFORMS.map((p) => loadPlatformPage(p.id, page))),
      D.Platforms[SERIAL_PLATFORM].home(page).then((res) => {
        const data = D.unwrap(res) || {};
        return { items: (data.items || []).map((item) => withPlatform(item, SERIAL_PLATFORM)), data };
      }),
    ]);

    const shortsGroups = shortsSettled.status === 'fulfilled'
      ? shortsSettled.value.filter((r) => r.status === 'fulfilled').map((r) => r.value.items)
      : [];
    const serialItems = serialSettled.status === 'fulfilled' ? serialSettled.value.items : [];

    if (!shortsGroups.length && !serialItems.length) {
      throw new Error('Konten gagal dimuat.');
    }

    const allGroups = [...shortsGroups, ...(serialItems.length ? [serialItems] : [])];
    const allItems = interleaveGroups(allGroups);
    const sectionItems = buildSectionItems(allItems);
    const items = [...sectionItems.trending, ...sectionItems.newRelease, ...sectionItems.forYou];
    return {
      items, sectionItems,
      data: { hasMore: items.length >= 12 },
    };
  }

  function updateLoadMore(items = null, data = {}) {
    if (!loadMoreBtn) return;
    if (Array.isArray(items)) {
      state.hasMore = data.hasMore !== false && items.length >= 6;
    }
    const forYouStart = state.items.length > 24 ? 24 : 0;
    const hasHiddenLocalItems = state.items.length > forYouStart + state.visibleForYou;
    loadMoreBtn.hidden = !state.hasMore && !hasHiddenLocalItems;
    loadMoreBtn.disabled = false;
  }

  async function loadHome(platform, append = false) {
    D.motion?.showProgress?.();
    state.platform = platform;

    if (!append) {
      state.page = 1;
      state.items = [];
      state.sectionItems = null;
      state.hasMore = true;
      state.visibleForYou = 6;
      if (loadMoreBtn) {
        loadMoreBtn.hidden = true;
        loadMoreBtn.disabled = true;
      }
      heroTrack.innerHTML = D.buildHeroSkeleton ? D.buildHeroSkeleton() : '';
      heroDots.innerHTML = '';
      setRailLoading(trendingRail, 8);
      setRailLoading(newReleaseRail, 8);
      forYouGrid.innerHTML = D.buildSkeletons(12);
    } else if (loadMoreBtn) {
      loadMoreBtn.disabled = true;
      forYouGrid.insertAdjacentHTML('beforeend', D.buildSkeletons(6));
    }

    try {
      const { items, data, sectionItems } = await loadHomeData(platform, state.page);
      state.items = append ? state.items.concat(items) : items;
      state.sectionItems = append || !sectionItems
        ? null
        : sectionItems;
      renderHomeSections(state.items, platform);
      updateLoadMore(items, data);
      D.motion?.hideProgress?.();
    } catch (e) {
      D.motion?.hideProgress?.();
      if (loadMoreBtn) loadMoreBtn.disabled = false;
      const message = e.message || D.friendlyError?.() || 'Gagal memuat konten.';
      D.toast?.error?.(message);
      if (append && state.items.length) {
        renderHomeSections(state.items, platform);
      } else {
        [trendingRail, newReleaseRail].forEach((c) => {
          c.innerHTML = D.buildErrorState(message, { inline: true, retryId: 'home' });
        });
        forYouGrid.innerHTML = D.buildErrorState(message, { retryId: 'home' });
        heroTrack.innerHTML = '';
        heroDots.innerHTML = '';
        forYouGrid.querySelectorAll('[data-retry-section]').forEach((btn) => {
          btn.addEventListener('click', () => loadHome(state.platform));
        });
        trendingRail.querySelectorAll('[data-retry-section]').forEach((btn) => {
          btn.addEventListener('click', () => loadHome(state.platform));
        });
        newReleaseRail.querySelectorAll('[data-retry-section]').forEach((btn) => {
          btn.addEventListener('click', () => loadHome(state.platform));
        });
      }
    }
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      const forYouStart = state.items.length > 24 ? 24 : 0;
      const hasHiddenLocalItems = state.items.length > forYouStart + state.visibleForYou;
      state.visibleForYou += 6;
      if (hasHiddenLocalItems) {
        renderHomeSections(state.items, state.platform);
        updateLoadMore();
        return;
      }
      state.page += 1;
      loadHome(state.platform, true);
    });
  }

  if (homePlatformBtn) {
    homePlatformBtn.addEventListener('click', () => {
      D.openSheet({
        title: D.t('discover.cat_title'),
        current: state.platform,
        items: platformItems(),
        onPick: (id) => {
          state.platform = id;
          D.Store.set(D.STORAGE.HOME_CAT, id);
          syncPlatformButton(id);
          loadHome(id);
        },
      });
    });
  }

  document.addEventListener('lang:changed', () => {
    syncPlatformButton(state.platform);
    loadHome(state.platform);
  });
  syncPlatformButton(state.platform);
  loadHome(state.platform);
})();
