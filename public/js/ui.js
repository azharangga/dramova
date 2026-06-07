/* =====================================================================
   Dramova · Shared UI helpers — CSS-variable aware (dark + light mode)
   ===================================================================== */
(function () {
  const D = window.DramSi;

  // ── CSS variable helpers ────────────────────────────────────────
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function isLight() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  // ── Active nav highlight ────────────────────────────────────────
  function highlightNav() {
    const path = location.pathname.replace(/\/$/, '') || '/';

    document.querySelectorAll('.bnav-item').forEach((el) => {
      const route  = el.dataset.route;
      const active = route === path || (route !== '/' && path.startsWith(route));
      el.classList.toggle('is-active', active);
      const icon  = el.querySelector('.nav-icon');
      const label = el.querySelector('.nav-label');
      if (icon)  icon.style.color  = active ? 'var(--accent)' : 'var(--text-secondary)';
      if (label) label.style.color = active ? 'var(--text-primary)' : 'var(--text-secondary)';
    });

    document.querySelectorAll('.dnav-link').forEach((el) => {
      const route  = el.dataset.route;
      const active = route === path || (route !== '/' && path.startsWith(route));
      el.classList.toggle('is-active', active);
      el.style.color      = active ? 'var(--accent)' : 'var(--text-secondary)';
      el.style.background = active ? 'rgba(43,166,65,0.13)' : '';
    });
  }

  // Re-highlight when theme changes (colors shift)
  document.addEventListener('theme:changed', highlightNav);

  // ── Bottom Sheet engine ─────────────────────────────────────────
  const sheet         = document.getElementById('sheet');
  const backdrop      = document.getElementById('sheetBackdrop');
  const sheetTitle    = document.getElementById('sheetTitle');
  const sheetList     = document.getElementById('sheetList');
  const sheetCloseBtn = document.getElementById('sheetCloseBtn');

  function openSheet({ title, items, current, onPick }) {
    sheetTitle.textContent = title;
    sheetList.innerHTML = items.map((it) => {
      const active = it.value === current;
      return `
        <button data-value="${it.value}"
                class="sheet-item flex items-center gap-3 px-4 py-3 text-left text-sm font-bold transition active:scale-[.98]"
                style="border-radius: 10px;
                       background: ${active ? 'rgba(43,166,65,0.13)' : 'var(--bg-raised)'};
                       border: 1px solid ${active ? 'var(--accent)' : 'transparent'};
                       color: var(--text-primary);">
          <span class="flex-1">${it.label}</span>
          ${it.sub ? `<span style="font-size:11px;color:var(--text-secondary);font-weight:400;">${it.sub}</span>` : ''}
          <i data-lucide="check" class="h-4 w-4" style="color:${active ? 'var(--accent)' : 'transparent'};"></i>
        </button>`;
    }).join('');

    sheetList.querySelectorAll('.sheet-item').forEach((btn) => {
      btn.addEventListener('click', () => { onPick(btn.dataset.value); closeSheet(); });
    });

    backdrop.classList.remove('hidden');
    requestAnimationFrame(() => sheet.classList.add('is-open'));
    window.refreshIcons?.();
  }

  function closeSheet() {
    sheet.classList.remove('is-open');
    setTimeout(() => backdrop.classList.add('hidden'), 280);
  }

  if (backdrop)      backdrop.addEventListener('click', closeSheet);
  if (sheetCloseBtn) sheetCloseBtn.addEventListener('click', closeSheet);

  // ── Language switcher ───────────────────────────────────────────
  const langBtn   = document.getElementById('langBtn');
  const langLabel = document.getElementById('langLabel');

  function syncLangLabel() {
    if (!langLabel) return;
    const cur = D.LANGS.find((l) => l.code === D.getLang()) || D.LANGS[0];
    langLabel.textContent = cur.short;
  }
  syncLangLabel();
  document.addEventListener('lang:changed', syncLangLabel);

  if (langBtn) {
    langBtn.addEventListener('click', () => {
      openSheet({
        title: D.t('sheet.lang'),
        current: D.getLang(),
        items: D.LANGS.map((l) => ({ value: l.code, label: l.label, sub: l.short })),
        onPick: (code) => D.setLang(code),
      });
    });
  }

  function showPlatformSheet(callback) {
    openSheet({
      title: D.t('sheet.platform'),
      current: D.getPlatform(),
      items: D.PLATFORMS.map((p) => ({ value: p.id, label: p.label })),
      onPick: (id) => { D.setPlatform(id); if (callback) callback(id); },
    });
  }

  // ── Platform tabs renderer ──────────────────────────────────────
  // Style: pill buttons, active = green border + green text (like screenshot)
  function renderPlatformTabs(container, onChange) {
    if (!container) return;
    container.innerHTML = D.PLATFORMS.map((p) => {
      const active = p.id === D.getPlatform();
      return `
        <button data-platform="${p.id}"
                class="ptab relative shrink-0 px-5 py-2 text-sm font-bold transition"
                style="border-radius: 9999px;
                       background: var(--bg-raised);
                       color: ${active ? 'var(--accent)' : 'var(--text-primary)'};
                       border: 2px solid ${active ? 'var(--accent)' : 'transparent'};
                       box-shadow: ${active ? '0 0 0 1px var(--accent)' : 'none'};">
          ${p.label}
        </button>`;
    }).join('');

    container.querySelectorAll('.ptab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.platform;
        D.setPlatform(id);
        container.querySelectorAll('.ptab').forEach((b) => {
          const a = b.dataset.platform === id;
          b.style.color       = a ? 'var(--accent)' : 'var(--text-primary)';
          b.style.border      = `2px solid ${a ? 'var(--accent)' : 'transparent'}`;
          b.style.boxShadow   = a ? '0 0 0 1px var(--accent)' : 'none';
        });
        if (onChange) onChange(id);
      });
    });
  }

  // ── Poster card builder ─────────────────────────────────────────
  function placeholderImg(title) {
    const text = encodeURIComponent((title || 'Dramova').slice(0, 18));
    // Use theme-aware placeholder
    const bg   = isLight() ? 'e8e8e8' : '1f1f1f';
    const fg   = isLight() ? '888888' : 'b3b3b3';
    return `https://placehold.co/300x450/${bg}/${fg}?text=${text}`;
  }

  function escapeHTML(value) {
    return String(value || '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[ch]));
  }

  function cleanTitle(title) {
    if (!title) return '';
    // Strip "Sub Indo - Drakor.id", "Sub Indo - Serial.id", etc.
    title = title.replace(/\s*[-–—]\s*(?:Drakor|Serial|DrakorId)(?:\.\w+)?\s*$/i, '');
    title = title.replace(/\s+Sub\s+Indo(?:\s*$|\s*[-–—].*$)/i, '');
    // Strip leading "Drama Korea", "Nonton"
    title = title.replace(/^(?:Drama Korea|Film Korea|Nonton)\s+/i, '');
    // Strip content in parentheses EXCEPT year (4 digits)
    title = title.replace(/\s*\((?!\d{4}\))[^)]*\)\s*/g, ' ');
    // Strip content in brackets []
    title = title.replace(/\s*\[[^\]]*\]\s*/g, ' ');
    // Clean up extra spaces
    title = title.replace(/\s{2,}/g, ' ').trim();
    return title;
  }

  function episodeCount(item) {
    if (!item) return 0;
    if (Array.isArray(item.episodes)) return item.episodes.length;
    return Number(
      item.episodes ||
      item.chapterCount ||
      item.totalEpisodes ||
      item.episodeCount ||
      item.episodesCount ||
      item.playableEpisodeCount ||
      item.totalEps ||
      item.total ||
      0
    ) || 0;
  }

  function upgradeImageUrl(raw, mode = 'poster') {
    if (!raw) return '';
    let url = String(raw)
      .replace(/[-_]\d{2,4}x\d{2,4}(\.\w{3,4})(\?.*)?$/, '$1$2')
      .replace(/\?(?:w|width|h|height|size|resize|fit)=[^&]*(?:&(?:w|width|h|height|size|resize|fit)=[^&]*)*/i, '');
    url = url.replace(/\/\d{2,4}x\d{2,4}\//, mode === 'hero' ? '/1280x720/' : '/600x900/');
    if (url.includes('imageView2') || url.includes('x-oss-process')) {
      url = url.replace(/\/(?:resize|thumbnail),\w_\d+(?:,\w_\d+)*/i, '');
    }
    return url;
  }

  function bestImage(item, mode = 'poster') {
    const raw = mode === 'hero'
      ? (item.banner || item.detailCover || item.cover || item.image || '')
      : (item.cover || item.image || item.detailCover || item.banner || '');
    return upgradeImageUrl(raw, mode) || placeholderImg(item.title);
  }

  function buildPoster(item, platform, opts = {}) {
    const img = bestImage(item, 'poster');
    const eps = episodeCount(item);
    const showEpisodeBadge = eps > 0 && !(platform === 'kdrama' && eps <= 1);
    const platformLabel = (D.Platforms?.[platform]?.label) || platform;

    const href = D.detailUrl(platform, item.id);

    // Tiny inline SVG placeholder (colored rectangle) for instant render
    const placeholderBg = isLight() ? '#e8e8e8' : '#1f1f1f';
    const thumbUrl = img;

    return `
      <a class="poster-card group relative block snap-start"
         data-id="${item.id}" data-platform="${platform}"
         href="${href}">
        <div class="relative aspect-[2/3] overflow-hidden"
             style="border-radius: 6px; background: ${placeholderBg};">
          ${opts.rank ? `<div class="rank-text absolute left-2 top-2 z-[2] select-none">${opts.rank}</div>` : ''}
          <span class="absolute right-2 top-2 z-[2] px-1.5 py-0.5 text-[10px] font-bold text-white"
                style="background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); border-radius: 4px; letter-spacing: 0.5px; text-transform: uppercase;">
            ${platformLabel}
          </span>
          <img src="${thumbUrl}" alt="${item.title || ''}" loading="lazy"
               onerror="this.src='${placeholderImg(item.title)}'"
               onload="this.classList.add('is-loaded')"
               class="h-full w-full object-cover poster-card__img" />
          <span class="pointer-events-none absolute inset-0"
                style="background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.65) 100%);"></span>
          ${showEpisodeBadge && !opts.hideEpisodeBadge ? `
          <span class="absolute left-2 bottom-2 z-[2] inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-white"
                style="background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); border-radius: 9999px;">
            <i data-lucide="play" class="h-2.5 w-2.5 fill-current"></i>${eps}
          </span>` : ''}
        </div>
        <div class="px-0.5 pt-2">
          <h4 class="text-sm font-bold leading-snug line-clamp-2" style="color: var(--text-primary);">${escapeHTML(cleanTitle(item.title) || D.t('common.no_title'))}</h4>
        </div>
      </a>`;
  }

  function buildSkeletons(count = 6) {
    return Array.from({ length: count }).map(() => `
      <div class="block snap-start">
        <div class="aspect-[2/3] skeleton" style="border-radius: 6px;"></div>
        <div class="mt-2 h-3 w-full rounded skeleton"></div>
        <div class="mt-1.5 h-2.5 w-3/5 rounded skeleton"></div>
      </div>`).join('');
  }

  function buildErrorState(message, opts = {}) {
    const retryId = opts.retryId || '';
    const retryAttr = retryId ? ` data-retry-section="${retryId}"` : '';
    const isInline = opts.inline === true;
    const wrapClass = isInline ? 'error-state error-state--inline' : 'error-state';
    return `
      <div class="${wrapClass}">
        <div class="error-state__icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <p class="error-state__message">${message}</p>
        <button type="button" class="error-state__retry"${retryAttr}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          ${D.t('common.retry')}
        </button>
      </div>`;
  }

  function buildHeroSkeleton() {
    return `
      <div class="home-hero-skeleton relative block w-full shrink-0 overflow-hidden">
        <div class="home-hero-skeleton-bg absolute inset-0 skeleton"></div>
        <div class="home-hero-skeleton-shade absolute inset-0"></div>
        <div class="home-hero-skeleton-copy absolute z-[2]">
          <div class="home-hero-skeleton-badge skeleton"></div>
          <div class="home-hero-skeleton-title home-hero-skeleton-title-a skeleton"></div>
          <div class="home-hero-skeleton-title home-hero-skeleton-title-b skeleton"></div>
          <div class="home-hero-skeleton-meta skeleton"></div>
          <div class="home-hero-skeleton-line home-hero-skeleton-line-a skeleton"></div>
          <div class="home-hero-skeleton-line home-hero-skeleton-line-b skeleton"></div>
          <div class="home-hero-skeleton-cta skeleton"></div>
        </div>
        <div class="home-hero-skeleton-dots absolute inset-x-0 z-[2] flex justify-center gap-2">
          <span class="home-hero-skeleton-dot skeleton is-active"></span>
          <span class="home-hero-skeleton-dot skeleton"></span>
          <span class="home-hero-skeleton-dot skeleton"></span>
          <span class="home-hero-skeleton-dot skeleton"></span>
          <span class="home-hero-skeleton-dot skeleton"></span>
        </div>
      </div>`;
  }

  // ── Init ────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', highlightNav);
  // Also call immediately in case DOMContentLoaded already fired
  if (document.readyState !== 'loading') highlightNav();
  // Fallback: retry after short delay (React hydration may re-render DOM)
  setTimeout(highlightNav, 100);
  setTimeout(highlightNav, 500);
  document.addEventListener('click', (e) => {
    const link = e.target.closest?.('a.poster-card');
    if (!link) return;
    if (!window.matchMedia('(max-width: 767.98px)').matches) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;

    const platform = link.dataset.platform || D.getPlatform();
    const id = link.dataset.id;
    if (!id) return;

    e.preventDefault();
    window.location.href = D.detailUrl(platform, id);
  });

  // ── Share Sheet (TikTok-style) ────────────────────────────────
  function openShareSheet(title, url) {
    document.getElementById('dramsiShareSheet')?.remove();
    document.getElementById('dramsiShareBackdrop')?.remove();

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title || 'Dramova');
    const items = [
      { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>', label: D.t('common.copied').replace('!', '') || 'Salin Link', action: 'copy' },
      { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>', label: 'WhatsApp', action: 'whatsapp' },
      { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>', label: 'Telegram', action: 'telegram' },
      { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>', label: 'Email', action: 'email' },
      { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>', label: D.t('common.share') || 'Lainnya', action: 'native' },
    ];

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const bg = isDark ? '#1c1c1c' : '#ffffff';
    const itemBg = isDark ? '#282828' : '#f2f2f2';
    const textColor = isDark ? '#fff' : '#1a1a1a';
    const subColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
    const iconColor = isDark ? '#fff' : '#1a1a1a';
    const handleColor = isDark ? '#444' : '#ccc';

    const backdrop = document.createElement('div');
    backdrop.id = 'dramsiShareBackdrop';
    backdrop.style.cssText = `position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.5);opacity:0;transition:opacity 0.2s ease;`;

    const sheet = document.createElement('div');
    sheet.id = 'dramsiShareSheet';
    sheet.style.cssText = `position:fixed;bottom:0;left:0;right:0;z-index:201;background:${bg};border-radius:16px 16px 0 0;padding:12px 16px calc(16px + env(safe-area-inset-bottom));transform:translateY(100%);transition:transform 0.3s cubic-bezier(.32,.72,.4,1);box-shadow:0 -4px 24px rgba(0,0,0,0.2);`;
    sheet.innerHTML = `
      <div style="width:36px;height:4px;border-radius:9999px;background:${handleColor};margin:0 auto 14px;"></div>
      <p style="font-size:14px;font-weight:750;color:${textColor};margin-bottom:14px;padding:0 4px;">${D.t('common.share') || 'Bagikan'}</p>
      <div style="display:grid;grid-template-columns:repeat(${items.length},1fr);gap:10px;">
        ${items.map((it) => `
          <button data-share-action="${it.action}" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 4px;border-radius:12px;background:${itemBg};border:none;cursor:pointer;transition:transform 0.1s;">
            <span style="color:${iconColor};">${it.icon}</span>
            <span style="font-size:10px;font-weight:650;color:${subColor};white-space:nowrap;">${it.label}</span>
          </button>
        `).join('')}
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);
    requestAnimationFrame(() => { backdrop.style.opacity = '1'; sheet.style.transform = 'translateY(0)'; });

    function close() {
      backdrop.style.opacity = '0';
      sheet.style.transform = 'translateY(100%)';
      setTimeout(() => { backdrop.remove(); sheet.remove(); }, 300);
    }
    backdrop.addEventListener('click', close);

    function fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); D.toast?.success?.(D.t('common.copied')); } catch (_) {}
      ta.remove();
    }

    sheet.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-share-action]');
      if (!btn) return;
      btn.style.transform = 'scale(0.93)';
      setTimeout(() => { btn.style.transform = ''; }, 120);
      const act = btn.dataset.shareAction;
      if (act === 'copy') {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(() => {
            D.toast?.success?.(D.t('common.copied'));
          }).catch(() => {
            fallbackCopy(url);
          });
        } else {
          fallbackCopy(url);
        }
        close();
      } else if (act === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, '_blank');
        close();
      } else if (act === 'telegram') {
        window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`, '_blank');
        close();
      } else if (act === 'email') {
        window.open(`mailto:?subject=${encodedTitle}&body=${encodedUrl}`, '_blank');
        close();
      } else if (act === 'native') {
        if (navigator.share) { navigator.share({ title: title || 'Dramova', url }).catch(() => {}); }
        close();
      }
    });
  }

  /**
   * Pick the best HD image for hero slider.
   * Priority: banner > detailCover > cover > image.
   * Also upgrades URLs by removing thumbnail size suffixes.
   */
  function heroImage(item) {
    const raw = bestImage(item, 'hero');
    if (!raw) return placeholderImg(item.title);
    // Upgrade: remove common thumbnail size suffixes to get full-res
    // e.g. "image-300x400.jpg" → "image.jpg"
    //      "image_200x300.webp" → "image.webp"
    //      "image?w=200&h=300" → "image"
    let url = raw
      .replace(/[-_]\d{2,4}x\d{2,4}(\.\w{3,4})(\?.*)?$/, '$1$2')
      .replace(/\?(?:w|width|h|height|size|resize|fit)=[^&]*(?:&(?:w|width|h|height|size|resize|fit)=[^&]*)*/i, '');
    // For some CDNs, request higher quality via query params
    if (url.includes('imageView2') || url.includes('x-oss-process')) {
      // Aliyun OSS / Qiniu — request larger size
      url = url.replace(/\/(?:resize|thumbnail),\w_\d+(?:,\w_\d+)*/i, '');
    }
    return url || placeholderImg(item.title);
  }

  Object.assign(D, {
    openSheet, closeSheet, openShareSheet,
    showPlatformSheet, renderPlatformTabs,
    buildPoster, buildSkeletons, buildHeroSkeleton, buildErrorState, placeholderImg,
    heroImage, episodeCount, cleanTitle,
    withRetry, lazyLoadImages,
  });

  // ── "Tonton Sekarang" CTA in hero → go directly to watch ──
  document.addEventListener('click', (e) => {
    const cta = e.target.closest('[data-watch-href]');
    if (!cta) return;
    e.preventDefault();
    e.stopPropagation();
    window.location.href = cta.dataset.watchHref;
  });

  // ── withRetry: wrap async function with auto-retry + error UI ──
  // Usage: withRetry(container, () => fetchData(), { onSuccess, retries, label })
  function withRetry(container, asyncFn, opts) {
    opts = opts || {};
    const retries = opts.retries || 2;
    const label = opts.label || '';

    async function attempt(n) {
      try {
        const result = await asyncFn();
        if (opts.onSuccess) opts.onSuccess(result);
        return result;
      } catch (err) {
        if (n < retries) {
          // Auto-retry with backoff
          await new Promise(function (r) { setTimeout(r, 800 * (n + 1)); });
          return attempt(n + 1);
        }
        // All retries failed — show error UI
        const message = err.message || D.friendlyError?.() || 'Gagal memuat konten.';
        if (container) {
          container.innerHTML = buildErrorState(message, { retryId: label || 'retry' });
          container.querySelectorAll('[data-retry-section]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              container.innerHTML = D.buildSkeletons(6);
              attempt(0);
            });
          });
        }
        if (D.toast) D.toast.error(message);
        throw err;
      }
    }

    return attempt(0);
  }

  // ── Image optimization: progressive loading with blur placeholder ──
  function lazyLoadImages(root) {
    root = root || document;
    var images = root.querySelectorAll('img[data-src]');
    if (!images.length) return;

    if ('IntersectionObserver' in window) {
      var imgObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            img.addEventListener('load', function () {
              img.classList.add('is-loaded');
              img.style.filter = '';
            }, { once: true });
            imgObs.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });
      images.forEach(function (img) { imgObs.observe(img); });
    } else {
      // Fallback: load all immediately
      images.forEach(function (img) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  }

  // ── Global: auto-apply is-loaded to all images on load ──────
  // This makes ALL images across all pages get the fade-in effect
  document.addEventListener('load', function (e) {
    if (e.target.tagName === 'IMG' && !e.target.classList.contains('is-loaded')) {
      e.target.classList.add('is-loaded');
    }
  }, true); // capture phase to catch all img load events

})();
