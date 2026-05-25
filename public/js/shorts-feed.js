/* =====================================================================
   Shorts Feed · TikTok-style vertical video feed for mobile.
   Uses exact same playback approach as watch.js (which works).
   ===================================================================== */
(function () {
  'use strict';
  if (window.matchMedia('(min-width: 768px)').matches) return;

  var D = window.DramSi;
  var feed = document.getElementById('shortsFeed');
  if (!feed) return;

  var state = {
    items: [],
    page: 1,
    currentIndex: -1,
    hls: null,
    playToken: 0,
    renderedCount: 0,
    loading: false,
  };

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.random() * (i + 1) | 0;
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function cleanTitle(t) { return D.cleanTitle ? D.cleanTitle(t) : (t || ''); }
  function pLabel(p) { return (D.Platforms && D.Platforms[p]) ? D.Platforms[p].label : p; }

  // ── Wait for HLS.js ──────────────────────────────────────────
  function waitForHls() {
    return new Promise(function (resolve) {
      if (window.Hls) { resolve(); return; }
      var iv = setInterval(function () {
        if (window.Hls) { clearInterval(iv); resolve(); }
      }, 100);
      setTimeout(function () { clearInterval(iv); resolve(); }, 6000);
    });
  }

  // ── Fetch GoodShort items + stream URLs ──────────────────────
  async function fetchItems(page) {
    try {
      var res = await D.Platforms.goodshort.home(page);
      var d = D.unwrap(res) || {};
      var items = d.items || (d.sections ? d.sections.flatMap(function (s) { return s.items || s.books || []; }) : []);
      return shuffle(items.map(function (it) { return Object.assign({}, it, { __platform: 'goodshort' }); }));
    } catch (_) {
      return [];
    }
  }

  async function getStreamUrl(item, ep) {
    try {
      var res = await D.Platforms.goodshort.stream(item.id, ep);
      var d = D.unwrap(res) || {};
      if (d.videoUrl && d.videoUrl.charAt(0) === '/') return d.videoUrl;
      if (d.qualityList && d.qualityList.length && d.qualityList[0].url) return d.qualityList[0].url;
      return d.videoUrl || '';
    } catch (_) {
      return '';
    }
  }

  async function buildFeedItems(rawItems) {
    var results = [];
    for (var i = 0; i < rawItems.length; i += 4) {
      var batch = rawItems.slice(i, i + 4);
      var promises = batch.map(function (item) {
        var eps = D.episodeCount ? D.episodeCount(item) : 0;
        var ep = eps > 1 ? Math.floor(Math.random() * eps) + 1 : 1;
        return getStreamUrl(item, ep).then(function (url) {
          if (!url) return null;
          return {
            id: item.id,
            __platform: 'goodshort',
            title: item.title || '',
            cover: item.cover || item.image || '',
            synopsis: item.synopsis || item.description || item.introduction || '',
            episode: ep,
            totalEps: eps,
            videoUrl: url,
          };
        });
      });
      var settled = await Promise.allSettled(promises);
      for (var j = 0; j < settled.length; j++) {
        if (settled[j].status === 'fulfilled' && settled[j].value) results.push(settled[j].value);
      }
    }
    return results;
  }

  // ── HTML ─────────────────────────────────────────────────────
  function buildItemHtml(item, idx) {
    var title = cleanTitle(item.title) || '';
    var p = item.__platform;
    var fav = D.isFavorite ? D.isFavorite({ id: item.id, platform: p }) : false;
    var epsText = item.totalEps > 1 ? item.episode + ' Ep dari ' + item.totalEps + ' Ep' : '1 Ep';
    var synopsis = item.synopsis || '';
    var synopsisHtml = synopsis
      ? '<p class="shorts-feed__synopsis" data-action="toggle-synopsis">' + synopsis + '</p><button class="shorts-feed__synopsis-toggle" data-action="toggle-synopsis">Selengkapnya</button>'
      : '';

    return '<div class="shorts-feed__item" data-index="' + idx + '" data-id="' + item.id + '" data-platform="' + p + '" data-ep="' + item.episode + '">' +
      '<img class="shorts-feed__poster" src="' + (item.cover || '') + '" alt="" loading="' + (idx < 2 ? 'eager' : 'lazy') + '"/>' +
      '<video id="sfv' + idx + '" playsinline webkit-playsinline loop muted preload="auto"></video>' +
      '<div class="shorts-feed__spinner"><div class="h-8 w-8 rounded-full border-[3px] border-white/15 border-t-white animate-spin-slow"></div></div>' +
      '<div class="shorts-feed__overlay"><div class="shorts-feed__info">' +
        '<span class="shorts-feed__badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' + pLabel(p) + '</span>' +
        '<p class="shorts-feed__title">' + title + '</p>' +
        '<p class="shorts-feed__ep">' + epsText + '</p>' +
        synopsisHtml +
      '</div></div>' +
      '<div class="shorts-feed__actions">' +
        '<button class="shorts-feed__action-btn ' + (fav ? 'is-liked' : '') + '" data-action="like"><svg width="22" height="22" viewBox="0 0 24 24" fill="' + (fav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>' +
        '<a class="shorts-feed__action-btn shorts-feed__action-btn--primary" href="' + D.watchUrl(p, item.id, item.episode) + '"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></a>' +
        '<button class="shorts-feed__action-btn" data-action="share"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>' +
      '</div>' +
    '</div>';
  }

  function renderItems() {
    var from = state.renderedCount;
    var to = state.items.length;
    if (from >= to) return;
    var html = '';
    for (var i = from; i < to; i++) html += buildItemHtml(state.items[i], i);
    feed.insertAdjacentHTML('beforeend', html);
    for (var j = from; j < to; j++) {
      var el = feed.querySelector('[data-index="' + j + '"]');
      if (el && obs) obs.observe(el);
    }
    state.renderedCount = to;
  }

  // ── setSrc — EXACT SAME LOGIC AS watch.js ────────────────────
  // This is the function that works in watch page. Copy it exactly.
  function setSrc(video, url) {
    // Destroy previous HLS instance
    if (state.hls) {
      state.hls.destroy();
      state.hls = null;
    }

    var isHls = /\.m3u8(\?|$)/i.test(url);

    if (isHls) {
      // SAME ORDER AS watch.js: check native first, then HLS.js
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari, iOS, some Android browsers)
        video.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        // HLS.js fallback
        var hlsConfig = D.videoOpt ? D.videoOpt.getHlsConfig() : { enableWorker: true, lowLatencyMode: true };
        var hls = new window.Hls(hlsConfig);
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (_e, data) {
          if (data.fatal) {
            console.error('[ShortsFeed] HLS fatal:', data.details);
          }
        });
        state.hls = hls;
      } else {
        // No HLS support at all
        video.src = url;
      }
    } else {
      video.src = url;
    }

    // SAME AS watch.js: set preload and call load()
    video.preload = 'auto';
    video.load();

    // SAME AS watch.js: just call play() directly
    video.play().catch(function () {});
  }

  // ── Stop current ─────────────────────────────────────────────
  function stopCurrent() {
    if (state.hls) { state.hls.destroy(); state.hls = null; }
    var els = feed.querySelectorAll('.shorts-feed__item.is-playing,.shorts-feed__item.is-paused,.shorts-feed__item.is-loading');
    for (var i = 0; i < els.length; i++) {
      var v = els[i].querySelector('video');
      if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
      els[i].classList.remove('is-playing', 'is-paused', 'is-loading');
    }
  }

  // ── Play at index ────────────────────────────────────────────
  function playAt(index) {
    if (index === state.currentIndex) return;
    if (index < 0 || index >= state.items.length) return;

    var token = ++state.playToken;
    var el = feed.querySelector('[data-index="' + index + '"]');
    if (!el) return;

    stopCurrent();
    state.currentIndex = index;

    var item = state.items[index];
    var video = el.querySelector('video');
    if (!video || !item || !item.videoUrl) return;

    el.classList.add('is-loading');

    // Listen for actual playback start
    function onPlaying() {
      video.removeEventListener('playing', onPlaying);
      if (state.playToken !== token) return;
      el.classList.remove('is-loading', 'is-paused');
      el.classList.add('is-playing');
      setTimeout(function () {
        if (state.playToken === token && !video.paused) video.muted = false;
      }, 300);
    }
    video.addEventListener('playing', onPlaying);

    // Use exact same approach as watch.js
    setSrc(video, item.videoUrl);

    // Load more if near end
    if (index >= state.items.length - 3 && !state.loading) loadMore();
  }

  async function loadMore() {
    state.loading = true;
    state.page += 1;
    var raw = await fetchItems(state.page);
    if (raw.length) {
      var items = await buildFeedItems(raw);
      if (items.length) {
        state.items = state.items.concat(items);
        renderItems();
      }
    }
    state.loading = false;
  }

  // ── Debounced play ───────────────────────────────────────────
  var playTimer = null;
  function requestPlay(index) {
    clearTimeout(playTimer);
    playTimer = setTimeout(function () { playAt(index); }, 80);
  }

  // ── Observer ─────────────────────────────────────────────────
  var obs = null;
  function setupObserver() {
    if (obs) obs.disconnect();
    obs = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting && entries[i].intersectionRatio >= 0.55) {
          var idx = parseInt(entries[i].target.dataset.index, 10);
          if (!isNaN(idx)) requestPlay(idx);
        }
      }
    }, { root: feed, threshold: [0.55] });
    var items = feed.querySelectorAll('.shorts-feed__item[data-index]');
    for (var i = 0; i < items.length; i++) obs.observe(items[i]);
  }

  // ── Click handlers ───────────────────────────────────────────
  feed.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    var el = e.target.closest('.shorts-feed__item');
    if (btn) {
      var act = btn.dataset.action;
      var idx = el ? +el.dataset.index : -1;

      if (act === 'toggle-play' && el) {
        var v = el.querySelector('video');
        if (!v) return;
        if (v.paused) {
          v.muted = true;
          v.play().then(function () {
            el.classList.remove('is-paused'); el.classList.add('is-playing');
            setTimeout(function () { v.muted = false; }, 100);
          }).catch(function () {});
        } else {
          v.pause(); el.classList.add('is-paused'); el.classList.remove('is-playing');
        }
        return;
      }
      if (act === 'toggle-synopsis' && el) {
        var synEl = el.querySelector('.shorts-feed__synopsis');
        var toggleBtn = el.querySelector('.shorts-feed__synopsis-toggle');
        if (synEl) {
          var expanded = synEl.classList.toggle('is-expanded');
          if (toggleBtn) toggleBtn.textContent = expanded ? 'Sembunyikan' : 'Selengkapnya';
        }
        return;
      }
      if (act === 'like' && idx >= 0) {
        var it = state.items[idx]; if (!it) return;
        var added = D.toggleFavorite ? D.toggleFavorite({ id: it.id, platform: it.__platform, title: cleanTitle(it.title), cover: it.cover || '', episodes: 0 }) : false;
        btn.classList.toggle('is-liked', added);
        var svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', added ? 'currentColor' : 'none');
        if (D.toast) D.toast[added ? 'success' : 'info'](D.t(added ? 'common.favorite_added' : 'common.favorite_removed', { title: cleanTitle(it.title) }));
        return;
      }
      if (act === 'share' && idx >= 0) {
        var it2 = state.items[idx]; if (!it2) return;
        D.openShareSheet(cleanTitle(it2.title) || 'Dramova', location.origin + D.watchUrl(it2.__platform, it2.id, it2.episode || 1));
        return;
      }
      return;
    }
    // Tap video area
    if (el && !e.target.closest('.shorts-feed__info') && !e.target.closest('.shorts-feed__actions') && !e.target.closest('video')) {
      var idx2 = el ? +el.dataset.index : -1;
      var v2 = el.querySelector('video');
      if (!v2) return;
      if (v2.paused) {
        v2.muted = true;
        v2.play().then(function () {
          el.classList.remove('is-paused'); el.classList.add('is-playing');
          setTimeout(function () { v2.muted = false; }, 100);
        }).catch(function () {});
      } else {
        v2.pause(); el.classList.add('is-paused'); el.classList.remove('is-playing');
      }
    }
  });

  // ── Init ─────────────────────────────────────────────────────
  (async function init() {
    feed.innerHTML = ('<div class="shorts-feed__item snap-start" style="height:100dvh">' +
      '<div class="absolute inset-0 skeleton" style="--skeleton-from:#111;--skeleton-to:#222"></div>' +
      '<div class="absolute bottom-0 left-0 right-0 p-6" style="padding-bottom:calc(100px + env(safe-area-inset-bottom))">' +
      '<div class="h-4 w-3/4 rounded skeleton" style="--skeleton-from:#222;--skeleton-to:#333"></div>' +
      '<div class="mt-3 h-3 w-1/2 rounded skeleton" style="--skeleton-from:#222;--skeleton-to:#333"></div>' +
      '</div></div>').repeat(2);

    await waitForHls();

    var raw = await fetchItems(1);
    if (!raw.length) {
      feed.innerHTML = '<div class="flex items-center justify-center bg-black text-white/60 text-sm" style="height:100dvh">Tidak ada konten.</div>';
      return;
    }

    var items = await buildFeedItems(raw);
    if (!items.length) {
      feed.innerHTML = '<div class="flex items-center justify-center bg-black text-white/60 text-sm" style="height:100dvh">Video tidak tersedia.</div>';
      return;
    }

    state.items = items;
    feed.innerHTML = '';
    renderItems();
    setupObserver();
    playAt(0);
  })();
})();
