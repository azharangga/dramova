/* =====================================================================
   Watch page · player + episode picker + history + favorites + auto-next.
   ===================================================================== */
(function () {
  const D = window.DramSi;

  // Parse from path: /shorts/watch/:platform/:id or /series/watch/:platform/:id
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const contentType = pathParts[0] || 'shorts'; // 'shorts' or 'series'
  const platform = pathParts[2] || 'dramanova';
  const dramaId = decodeURIComponent(pathParts.slice(3).join('/') || '');
  const params = new URLSearchParams(window.location.search);
  const initialEp = parseInt(params.get('ep') || '1', 10);

  const dom = {
    title: document.getElementById('dramaTitle'),
    titleMobile: document.getElementById('dramaTitleMobile'),
    epLabel: document.getElementById('epLabel'),
    epLabelMobile: document.getElementById('epLabelMobile'),
    totalLabel: document.getElementById('totalLabel'),
    platformLabel: document.getElementById('platformLabel'),
    platformLabelMobile: document.getElementById('platformLabelMobile'),
    synopsis: document.getElementById('dramaSynopsis'),
    epList: document.getElementById('epList'),
    epListMobile: document.getElementById('epListMobile'),
    epCount: document.getElementById('epCount'),
    epBadgeMobile: document.getElementById('epBadgeMobile'),
    epSheetSub: document.getElementById('epSheetSub'),
    video: document.getElementById('video'),
    overlay: document.getElementById('playerOverlay'),
    overlayText: document.getElementById('playerOverlayText'),
    playerWrap: document.getElementById('playerWrap'),
    playerInner: document.getElementById('playerInner'),
    favBtn: document.getElementById('favoriteBtn'),
    favBtnMobile: document.getElementById('favoriteBtnMobile'),
    prevBtn: document.getElementById('prevEpBtn'),
    nextBtn: document.getElementById('nextEpBtn'),
    prevBtnMobile: document.getElementById('prevEpBtnMobile'),
    nextBtnMobile: document.getElementById('nextEpBtnMobile'),
    openEpSheetBtn: document.getElementById('openEpSheetBtn'),
    epSheet: document.getElementById('epSheet'),
    epSheetBackdrop: document.getElementById('epSheetBackdrop'),
    epSheetCloseBtn: document.getElementById('epSheetCloseBtn'),
    epSheetScroller: document.getElementById('epSheetScroller'),
    swipeHint: document.getElementById('swipeHint'),
    controls: document.getElementById('watchControls'),
    centerPlayBtn: document.getElementById('centerPlayBtn'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    rewindBtn: document.getElementById('rewindBtn'),
    forwardBtn: document.getElementById('forwardBtn'),
    muteBtn: document.getElementById('muteBtn'),
    volumeBar: document.getElementById('volumeBar'),
    seekBar: document.getElementById('seekBar'),
    currentTimeLabel: document.getElementById('currentTimeLabel'),
    durationLabel: document.getElementById('durationLabel'),
    desktopTimeLabel: document.getElementById('desktopTimeLabel'),
    speedBtn: document.getElementById('speedBtn'),
    speedMenu: document.getElementById('speedMenu'),
    pipBtn: document.getElementById('pipBtn'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),
    seekFeedback: document.getElementById('seekFeedback'),
  };

  const state = {
    drama: null,
    episodes: [],
    currentEp: initialEp,
    qualities: [],
    currentQuality: null,
    subtitles: [],
    hls: null,
    fallbackTimer: null,
    triedProxy: false,
    lastSrc: null,
    streamCache: new Map(),
    prefetchLinks: new Map(),
    warmVideo: null,
    scrollAnimationTimer: null,
    streamToken: 0,
    isInitialStream: true,
    playbackRate: 1,
    pendingResumeTime: 0,
    seeking: false,
    feedbackTimer: null,
    autoPipActive: false,
    pipRequesting: false,
    resumeToast: null,
  };

  if (!dramaId || !D.Platforms[platform]) {
    dom.title.textContent = D.t('player.invalid_params');
    dom.epLabel.textContent = D.t('player.invalid_hint');
    return;
  }

  // Adjust player aspect ratio for vertical drama
  // Initial hint dari platform config — akan di-override saat loadedmetadata
  const orientation = D.Platforms[platform].orientation;
  if (orientation === 'vertical') {
    dom.playerInner.classList.remove('aspect-video');
    dom.playerInner.classList.add('aspect-vertical', 'max-w-[420px]');
  }

  dom.platformLabel.querySelector('span').textContent = D.Platforms[platform].label;
  dom.platformLabelMobile.querySelector('span').textContent = D.Platforms[platform].label;

  // Aktifkan mode immersive di mobile (CSS akan menyembunyikan topbar + bottom nav)
  document.body.classList.add('is-watch');
  document.body.classList.add(orientation === 'vertical' ? 'is-vertical' : 'is-horizontal');
  window.addEventListener('beforeunload', () => {
    document.body.classList.remove('is-watch', 'is-vertical', 'is-horizontal');
  });

  // ── Helpers ────────────────────────────────────────────────────
  function showOverlay(text) {
    dom.overlay.classList.remove('hidden');
    if (text) dom.overlayText.textContent = text;
  }
  function hideOverlay() {
    dom.overlay.classList.add('hidden');
  }
  function setWatchSkeleton(loading) {
    document.body.classList.toggle('watch-loading', loading);
  }
  function showWatchError(message) {
    dom.overlay.classList.add('is-error');
    showOverlay(message || D.t('player.content_error'));
  }
  function showWatchLoading(message) {
    dom.overlay.classList.remove('is-error');
    showOverlay(message);
  }

  function cleanEpisodeTitle(title, ep) {
    const text = String(title || '').trim();
    if (!text) return '';

    const generic = new RegExp(`^(?:ep(?:isode)?\\.?|episode)\\s*0*${ep}$`, 'i');
    if (generic.test(text)) return '';

    const prefixed = new RegExp(`^(?:ep(?:isode)?\\.?|episode)\\s*0*${ep}\\s*[-:·|]+\\s*`, 'i');
    return text.replace(prefixed, '').trim();
  }

  function episodeLabel(ep, title) {
    const cleanTitle = cleanEpisodeTitle(title, ep);
    return cleanTitle ? `Ep ${ep} · ${cleanTitle}` : `Ep ${ep}`;
  }

  function progressKey() {
    return `dramsi.watchProgress.${platform}.${dramaId}`;
  }

  function readProgress() {
    try {
      return JSON.parse(localStorage.getItem(progressKey()) || 'null');
    } catch (_) {
      return null;
    }
  }

  function writeProgress() {
    if (!dom.video || !Number.isFinite(dom.video.currentTime)) return;
    const duration = Number.isFinite(dom.video.duration) ? dom.video.duration : 0;
    if (duration && (dom.video.currentTime < 5 || dom.video.currentTime > duration - 8)) return;
    localStorage.setItem(progressKey(), JSON.stringify({
      ep: state.currentEp,
      time: Math.floor(dom.video.currentTime),
      duration: Math.floor(duration || 0),
      ts: Date.now(),
    }));
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  }

  function setIcon(button, iconName, className = 'h-5 w-5') {
    if (!button) return;
    if (button.dataset.icon === iconName) return;
    button.dataset.icon = iconName;
    button.innerHTML = `<i data-lucide="${iconName}" class="${className}"></i>`;
    window.refreshIcons?.();
  }

  function updateTimeControls() {
    const video = dom.video;
    if (!video) return;
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const current = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    if (!state.seeking && dom.seekBar) {
      dom.seekBar.value = duration ? String(Math.round((current / duration) * 1000)) : '0';
      dom.seekBar.style.setProperty('--progress', `${duration ? (current / duration) * 100 : 0}%`);
    }
    if (dom.currentTimeLabel) dom.currentTimeLabel.textContent = formatTime(current);
    if (dom.durationLabel) dom.durationLabel.textContent = formatTime(duration);
    if (dom.desktopTimeLabel) dom.desktopTimeLabel.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  }

  function updatePlayerControls() {
    const video = dom.video;
    if (!video) return;
    updateTimeControls();
    setIcon(dom.playPauseBtn, video.paused ? 'play' : 'pause');
    setIcon(dom.centerPlayBtn, video.paused ? 'play' : 'pause', 'h-9 w-9');
    setIcon(dom.muteBtn, video.muted || video.volume === 0 ? 'volume-x' : video.volume < 0.5 ? 'volume-1' : 'volume-2');
    if (dom.volumeBar) {
      const volumeValue = video.muted ? 0 : video.volume;
      dom.volumeBar.value = String(volumeValue);
      dom.volumeBar.style.setProperty('--progress', `${volumeValue * 100}%`);
    }
    if (dom.speedBtn) dom.speedBtn.textContent = `${Number(video.playbackRate).toFixed(2).replace(/\.?0+$/, '')}x`;
    dom.playerInner?.classList.toggle('is-paused', video.paused);
    dom.playerInner?.classList.toggle('is-playing', !video.paused);
    updateModeButtons();
  }

  function togglePlay() {
    if (!dom.video) return;
    if (dom.video.paused) tryAutoplay();
    else dom.video.pause();
  }

  function seekBy(delta) {
    if (!dom.video) return;
    const duration = Number.isFinite(dom.video.duration) ? dom.video.duration : 0;
    dom.video.currentTime = Math.min(Math.max(0, dom.video.currentTime + delta), duration || Infinity);
    showSeekFeedback(delta);
    updateTimeControls();
  }

  function showSeekFeedback(delta, text) {
    if (!dom.seekFeedback) return;
    clearTimeout(state.feedbackTimer);
    dom.seekFeedback.textContent = text || `${delta > 0 ? '+' : ''}${delta}s`;
    dom.seekFeedback.classList.remove('is-visible');
    void dom.seekFeedback.offsetWidth;
    dom.seekFeedback.classList.add('is-visible');
    state.feedbackTimer = setTimeout(() => {
      dom.seekFeedback.classList.remove('is-visible');
    }, 650);
  }

  function updateModeButtons() {
    dom.pipBtn?.classList.toggle('is-active', document.pictureInPictureElement === dom.video);
    dom.fullscreenBtn?.classList.toggle('is-active', Boolean(document.fullscreenElement));
    setIcon(dom.fullscreenBtn, document.fullscreenElement ? 'minimize' : 'maximize');
  }

  async function toggleFullscreen() {
    const target = dom.playerWrap || dom.playerInner;
    document.body.classList.add('watch-fullscreen-active');
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (target?.requestFullscreen) {
        await target.requestFullscreen();
      } else if (target?.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      }
    } catch (_) {}
    if (!document.fullscreenElement) document.body.classList.remove('watch-fullscreen-active');
    updateModeButtons();
  }

  function tryAutoplay() {
    const video = dom.video;
    if (!video || !video.src) return;
    const playPromise = video.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {
        showOverlayUI();
        showSeekFeedback(0, 'Tap untuk putar');
        updatePlayerControls();
      });
    }
  }

  async function enterPip({ automatic = false } = {}) {
    if (!dom.video || !document.pictureInPictureEnabled || document.pictureInPictureElement || dom.video.readyState < 1 || state.pipRequesting) return;
    state.pipRequesting = true;
    if (automatic) state.autoPipActive = true;
    try {
      await dom.video.requestPictureInPicture();
      state.autoPipActive = automatic;
    } catch (_) {
      if (automatic) state.autoPipActive = false;
    }
    state.pipRequesting = false;
    updateModeButtons();
  }

  async function exitPip({ automaticOnly = false } = {}) {
    if (!document.pictureInPictureElement) return;
    if (automaticOnly && !state.autoPipActive) return;
    try {
      await document.exitPictureInPicture();
    } catch (_) {}
    state.autoPipActive = false;
    state.pipRequesting = false;
    updateModeButtons();
  }

  function applyVideoAspect() {
    const vw = dom.video?.videoWidth || 0;
    const vh = dom.video?.videoHeight || 0;
    if (!vw || !vh || !dom.playerInner) return;
    const ratio = vw / vh;
    dom.playerInner.style.aspectRatio = `${vw} / ${vh}`;
    dom.playerInner.classList.toggle('is-portrait-video', ratio < 0.8);
    dom.playerInner.classList.toggle('is-wide-video', ratio >= 1.4);
    if (ratio < 0.8) {
      dom.playerInner.classList.remove('aspect-video');
      dom.playerInner.classList.add('aspect-vertical', 'max-w-[420px]');
      document.body.classList.add('is-vertical');
      document.body.classList.remove('is-horizontal');
    } else {
      dom.playerInner.classList.remove('aspect-video', 'aspect-vertical', 'max-w-[420px]');
      document.body.classList.remove('is-vertical');
      document.body.classList.add('is-horizontal');
    }
    state._aspectApplied = true;
  }

  function maybeProxy(rawUrl) {
    if (!rawUrl) return rawUrl;
    // If URL is already a proxy/internal path, use as-is
    if (String(rawUrl).startsWith('/')) return rawUrl;
    try {
      const u = new URL(rawUrl, window.location.href);
      const pageHttps = window.location.protocol === 'https:';
      if (pageHttps && u.protocol === 'http:') {
        // Need proxy for mixed-content — use signed URL from state if available
        const signed = state._signedProxyUrl;
        if (signed) return signed;
        // Fallback: try raw URL anyway (some CDNs redirect HTTP→HTTPS)
        return rawUrl;
      }
      return rawUrl;
    } catch (_) {
      return rawUrl;
    }
  }
  function viaProxy(rawUrl) {
    if (!rawUrl) return rawUrl;
    if (String(rawUrl).startsWith('/')) return rawUrl;
    // Use signed proxy URL from state if available
    const signed = state._signedProxyUrl;
    if (signed) return signed;
    // Fallback: use raw URL directly
    return rawUrl;
  }

  function setSrc(url, type, opts = {}) {
    if (state.hls) {
      state.hls.destroy();
      state.hls = null;
    }
    if (!url) {
      showWatchError(D.t('player.video_unavailable'));
      return;
    }

    const video = dom.video;
    const isHls = type === 'hls' || /\.m3u8(\?|$)/i.test(url);
    const quality = state.currentQuality || {};

    // Strategi playback (urutan prioritas):
    // 1. HTTPS direct (tanpa proxy — paling cepat, zero buffering)
    // 2. Signed proxy (fallback kalau direct gagal)
    let finalUrl;
    if (opts.forceProxy) {
      // Sudah gagal direct → pakai proxy
      finalUrl = quality._signedProxy || quality.proxiedUrl || viaProxy(url);
    } else if (isHls) {
      // HLS: pakai URL yang sudah di-set (bisa proxy playlist atau direct)
      finalUrl = url.startsWith('/') ? url : maybeProxy(url);
    } else {
      // MP4: coba HTTPS direct dulu (skip proxy = no buffering)
      const httpsUrl = quality.httpsUrl || '';
      const directUrl = quality.directUrl || quality.rawUrl || '';
      const pageHttps = window.location.protocol === 'https:';

      if (pageHttps && httpsUrl) {
        // Coba HTTPS version dari CDN (banyak CDN support meski URL asli HTTP)
        finalUrl = httpsUrl;
      } else if (!pageHttps && directUrl) {
        // Halaman HTTP → bisa langsung akses CDN HTTP
        finalUrl = directUrl;
      } else {
        // Fallback: langsung pakai proxy (signed)
        finalUrl = quality._signedProxy || quality.proxiedUrl || viaProxy(url);
      }
    }

    // Bersihkan track lama
    Array.from(video.querySelectorAll('track')).forEach((t) => t.remove());

    if (isHls) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = finalUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        const hlsConfig = D.videoOpt ? D.videoOpt.getHlsConfig() : { enableWorker: true, lowLatencyMode: true };
        const hls = new window.Hls(hlsConfig);
        hls.loadSource(finalUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, (_e, data) => {
          if (data.fatal && !opts.forceProxy) {
            setSrc(url, type, { forceProxy: true, seamless: opts.seamless });
          }
        });
        state.hls = hls;
      } else {
        showWatchError(D.t('player.unsupported'));
        return;
      }
    } else {
      video.src = finalUrl;
    }
    video.preload = 'auto';
    video.autoplay = true;
    video.defaultPlaybackRate = 1;
    video.playbackRate = state.playbackRate;
    video.muted = false;
    if (!video.volume) video.volume = 1;
    video.load();

    // Inject subtitle tracks
    injectSubtitles();
    D.videoOpt?.enhanceAudio?.(video);

    // Play strategy: untuk proxy MP4, tunggu buffer dulu
    const viaProxyStream = finalUrl.includes('/proxy/');
    if (viaProxyStream) {
      // Via proxy — tunggu canplay supaya tidak buffering terus
      const tryPlay = () => tryAutoplay();
      video.addEventListener('canplay', tryPlay, { once: true });
      setTimeout(() => { if (video.paused) tryPlay(); }, 4000);
    } else {
      // Direct CDN — langsung play (CDN cepat)
      tryAutoplay();
    }

    state.lastSrc = { url, type };
    if (!opts.forceProxy) {
      clearTimeout(state.fallbackTimer);
      // Kalau pakai HTTPS direct, fallback cepat (2.5s) karena kalau CDN
      // tidak support HTTPS, akan langsung error/timeout
      const isDirectAttempt = !finalUrl.includes('/proxy/') && !finalUrl.startsWith('/');
      const fallbackMs = isDirectAttempt ? 2500 : 8000;
      state.fallbackTimer = setTimeout(() => {
        if (video.readyState < 2 && !video.error) {
          console.warn('[Dramova] playback timeout, fallback ke proxy');
          setSrc(url, type, { forceProxy: true, seamless: opts.seamless });
        }
      }, fallbackMs);
    }
  }

  function injectSubtitles() {
    const subs = state.subtitles || [];
    if (subs.length === 0) return;

    const video = dom.video;
    // Pilih track default: cocokkan dengan bahasa global (id), fallback ke first.
    const userLang = D.getLang ? D.getLang() : 'id';
    const langPriority = (s) => {
      const l = (s.lang || '').toLowerCase();
      // 'in' adalah ISO lama untuk Indonesia, alias 'id'
      if (userLang === 'id' && (l === 'id' || l === 'in')) return 0;
      if (l === userLang) return 0;
      if (l === 'en') return 1;
      return 2;
    };
    const sorted = [...subs].sort((a, b) => langPriority(a) - langPriority(b));

    sorted.forEach((s, idx) => {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = s.label || s.lang || 'Subtitle';
      // browser native srclang harus pakai BCP47, 'in' di-normalize ke 'id'
      const sl = (s.lang || '').toLowerCase();
      track.srclang = sl === 'in' ? 'id' : sl || 'id';
      track.src = s.proxiedUrl || s.url;
      if (idx === 0) track.default = true;
      video.appendChild(track);
    });

    // Aktifkan track default begitu loaded + posisi subtitle yang rapi
    setTimeout(() => {
      if (video.textTracks && video.textTracks.length) {
        for (let i = 0; i < video.textTracks.length; i++) {
          const tt = video.textTracks[i];
              tt.mode = i === 0 ? 'showing' : 'disabled';
          // Begitu cue mulai aktif, geser ke posisi yang gak ketabrak controls
          tt.addEventListener('cuechange', () => {
            for (const cue of tt.activeCues || []) {
              // line=85 ≈ 85% dari atas video → cukup ruang untuk control bar
              cue.line = 85;
              cue.snapToLines = false;
              cue.position = 50;
              cue.align = 'center';
            }
          });
        }
      }
    }, 200);
  }

  function epButtonHTML(ep, i) {
    const num = ep.episode || ep.number || i + 1;
    const isActive = num === state.currentEp;
    return `<button data-ep="${num}"
      class="ep-btn ${isActive ? 'is-active' : ''} relative aspect-square grid place-items-center text-sm font-bold transition active:scale-95"
      style="border-radius: 8px;"
      ${isActive ? 'aria-current="true"' : ''}>
      ${num}
    </button>`;
  }

  function renderEpisodes() {
    if (!state.episodes || state.episodes.length === 0) {
      const msg = `<p class="col-span-full empty-state">${D.t('common.episode_list_empty')}</p>`;
      dom.epList.innerHTML = msg;
      dom.epListMobile.innerHTML = msg;
      dom.epCount.textContent = '';
      if (dom.epBadgeMobile) dom.epBadgeMobile.textContent = '0';
      if (dom.epSheetSub) dom.epSheetSub.textContent = '—';
      return;
    }
    const html = state.episodes.map((ep, i) => epButtonHTML(ep, i)).join('');
    dom.epList.innerHTML = html;
    dom.epListMobile.innerHTML = html;

    const lbl = `${state.episodes.length} ${D.t('common.episodes')}`;
    dom.epCount.textContent = lbl;
    dom.totalLabel.textContent = lbl;
    if (dom.epBadgeMobile) dom.epBadgeMobile.textContent = `Ep ${state.currentEp}`;
    if (dom.epSheetSub) dom.epSheetSub.textContent = `Ep ${state.currentEp} · ${lbl}`;

    const handler = (btn) => {
      const ep = parseInt(btn.dataset.ep, 10);
      if (!ep) return;
      closeEpSheet();
      if (ep === state.currentEp) return;
      gotoEp(ep);
    };
    dom.epList.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => handler(b)));
    dom.epListMobile.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => handler(b)));

    syncPrevNextDisabled();
    scrollActiveEpIntoView();
  }

  function renderEpisodeSkeletons() {
    const html = Array.from({ length: 24 }).map(() => (
      '<div class="aspect-square skeleton" style="border-radius:8px;"></div>'
    )).join('');
    dom.epList.innerHTML = html;
    dom.epListMobile.innerHTML = html;
    dom.epCount.textContent = D.t('player.loading');
    if (dom.epBadgeMobile) dom.epBadgeMobile.textContent = '...';
    if (dom.epSheetSub) dom.epSheetSub.textContent = D.t('detail.loading_episode');
  }

  function syncPrevNextDisabled() {
    const atStart = state.currentEp <= 1;
    const atEnd = state.currentEp >= state.episodes.length;
    dom.prevBtn.disabled = atStart;
    dom.nextBtn.disabled = atEnd;
    if (dom.prevBtnMobile) dom.prevBtnMobile.disabled = atStart;
    if (dom.nextBtnMobile) dom.nextBtnMobile.disabled = atEnd;
  }

  function scrollActiveEpIntoView() {
    const sel = `[data-ep="${state.currentEp}"]`;
    [dom.epList, dom.epListMobile].forEach((c) => {
      const btn = c.querySelector(sel);
      if (btn) btn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  function animateEpisodeScroll(direction) {
    if (!dom.playerInner || !dom.video || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    clearTimeout(state.scrollAnimationTimer);

    const ghost = document.createElement('div');
    ghost.className = 'watch-scroll-ghost';

    const ghostVideo = dom.video.cloneNode(false);
    ghostVideo.removeAttribute('id');
    ghostVideo.removeAttribute('controls');
    ghostVideo.muted = true;
    ghostVideo.playsInline = true;
    ghostVideo.src = dom.video.currentSrc || dom.video.src || '';
    if (dom.video.poster) ghostVideo.poster = dom.video.poster;
    ghost.appendChild(ghostVideo);

    dom.playerInner.appendChild(ghost);
    dom.playerInner.classList.remove('watch-scroll-next', 'watch-scroll-prev');
    void dom.playerInner.offsetWidth;
    dom.playerInner.classList.add(direction === 'prev' ? 'watch-scroll-prev' : 'watch-scroll-next');

    state.scrollAnimationTimer = setTimeout(() => {
      ghost.remove();
      dom.playerInner.classList.remove('watch-scroll-next', 'watch-scroll-prev');
    }, 380);
  }

  function gotoEp(ep) {
    if (ep < 1 || (state.episodes.length && ep > state.episodes.length)) return;
    const direction = ep < state.currentEp ? 'prev' : 'next';
    if (ep !== state.currentEp) animateEpisodeScroll(direction);
    state.currentEp = ep;
    state._aspectApplied = false; // Reset agar aspect ratio di-detect ulang
    const url = new URL(window.location.href);
    url.searchParams.set('ep', String(ep));
    history.replaceState(null, '', url.toString());
    loadStream(ep, { seamless: true });
    renderEpisodes();
  }

  function syncFavBtn() {
    if (!state.drama) return;
    const fav = D.isFavorite({ id: state.drama.id || dramaId, platform });
    // Desktop button
    const icon = dom.favBtn.querySelector('[data-lucide]');
    dom.favBtn.style.background    = fav ? 'var(--accent-control-bg)' : 'var(--control-bg)';
    dom.favBtn.style.borderColor   = fav ? 'var(--accent-control-border)' : 'var(--border-muted)';
    dom.favBtn.style.color         = fav ? 'var(--accent-control-text)' : 'var(--text-secondary)';
    if (icon) icon.style.fill = fav ? 'currentColor' : 'none';
    // Mobile floating button
    if (dom.favBtnMobile) {
      const iconM = dom.favBtnMobile.querySelector('[data-lucide]');
      dom.favBtnMobile.style.color = fav ? 'var(--accent)' : '#ffffff';
      if (iconM) iconM.style.fill = fav ? 'currentColor' : 'none';
    }
  }

  // ── Auto-next ─────────────────────────────────────────────────
  // Diam-diam aja: kalau video selesai dan masih ada episode setelahnya,
  // langsung lompat ke episode berikutnya tanpa overlay.
  function autoNext() {
    if (state.currentEp < state.episodes.length) {
      gotoEp(state.currentEp + 1);
    }
  }

  // ── Cast modal ──────────────────────────────────────────────────
  function openWatchCastModal(cast) {
    document.getElementById('castModal')?.remove();
    document.getElementById('castModalBackdrop')?.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'castModalBackdrop';
    backdrop.className = 'cast-modal-backdrop';

    const modal = document.createElement('div');
    modal.id = 'castModal';
    modal.className = 'cast-modal';
    modal.innerHTML = `
      <button class="cast-modal-close" aria-label="Tutup">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <img src="${cast.photo}" alt="${cast.name}" referrerpolicy="no-referrer" class="cast-modal-img" />
      <p class="cast-modal-name">${cast.name}</p>
      ${cast.role ? `<p class="cast-modal-role">${cast.role}</p>` : ''}
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    requestAnimationFrame(() => {
      backdrop.classList.add('is-visible');
      modal.classList.add('is-visible');
    });

    function close() {
      backdrop.classList.remove('is-visible');
      modal.classList.remove('is-visible');
      setTimeout(() => { backdrop.remove(); modal.remove(); }, 250);
    }
    backdrop.addEventListener('click', close);
    modal.querySelector('.cast-modal-close').addEventListener('click', close);
  }

  // ── Loaders ────────────────────────────────────────────────────
  async function loadDetail() {
    showWatchLoading(D.t('player.loading'));
    setWatchSkeleton(true);
    renderEpisodeSkeletons();
    D.motion?.showProgress?.();
    try {
      const res = await D.Platforms[platform].detail(dramaId);
      const data = D.unwrap(res) || {};
      const drama = data.data || data;
      state.drama = drama;
      state.episodes = drama.episodes || data.episodes || [];
      const saved = readProgress();
      if (!params.has('ep') && saved?.ep && (!state.episodes.length || saved.ep <= state.episodes.length)) {
        state.currentEp = Math.max(1, Number(saved.ep) || 1);
        const url = new URL(window.location.href);
        url.searchParams.set('ep', String(state.currentEp));
        history.replaceState(null, '', url.toString());
      }

      const title = D.cleanTitle?.(drama.title || drama.bookName) || drama.title || drama.bookName || D.t('common.no_title');
      dom.title.textContent = title;
      dom.title.style.display = '';
      if (dom.titleMobile) dom.titleMobile.textContent = title;

      // Hide skeletons, show real content
      const titleSkel = document.getElementById('watchTitleSkeleton');
      const metaRow = document.getElementById('watchMetaRow');
      const navSkel = document.getElementById('watchNavSkeleton');
      const navReal = document.getElementById('watchNavReal');
      const synSkel = document.getElementById('watchSynopsisSkeleton');
      const synReal = document.getElementById('watchSynopsisReal');
      const shareBtn = document.getElementById('shareBtn');
      const favBtn = document.getElementById('favoriteBtn');
      if (titleSkel) titleSkel.style.display = 'none';
      if (metaRow) metaRow.style.display = '';
      if (navSkel) navSkel.style.display = 'none';
      if (navReal) navReal.style.display = '';
      if (synSkel) synSkel.style.display = 'none';
      if (synReal) synReal.style.display = '';
      if (shareBtn) { shareBtn.style.opacity = '1'; shareBtn.style.pointerEvents = ''; }
      if (favBtn) { favBtn.style.opacity = '1'; favBtn.style.pointerEvents = ''; }

      const synopsis = drama.synopsis || drama.description || '';
      dom.synopsis.textContent = synopsis;
      requestAnimationFrame(() => {
        const el = dom.synopsis;
        const toggleBtn = document.getElementById('toggleSynopsisBtn');
        if (el && toggleBtn && el.scrollHeight > el.clientHeight + 2) {
          toggleBtn.hidden = false;
          toggleBtn.onclick = () => {
            const expanded = el.classList.toggle('line-clamp-3');
            toggleBtn.textContent = !expanded ? D.t('common.read_less') : D.t('common.read_more');
          };
        }
      });

      // Render cast
      const castList = drama.cast || [];
      const watchCast = document.getElementById('watchCast');
      if (watchCast && castList.length) {
        watchCast.innerHTML = `
          <h3 class="detail-cast-title">${D.t('detail.cast') || 'Pemeran'}</h3>
          <div class="detail-cast-scroll">
            ${castList.map((c, i) => {
              const initial = (c.name || '?')[0].toUpperCase();
              const photoHtml = c.photo
                ? `<img src="${c.photo}" alt="${c.name}" loading="lazy" referrerpolicy="no-referrer" data-cast-idx="${i}" class="detail-cast-img" onerror="this.parentElement.innerHTML='<span class=detail-cast-initial>${initial}</span>';" />`
                : `<span class="detail-cast-initial">${initial}</span>`;
              return `
              <div class="detail-cast-item">
                <div class="detail-cast-photo">${photoHtml}</div>
                <span class="detail-cast-name">${c.name}</span>
                ${c.role ? `<span class="detail-cast-role">${c.role}</span>` : ''}
              </div>`;
            }).join('')}
          </div>
        `;
        watchCast.hidden = false;

        // Click on cast photo → fullscreen modal
        watchCast.addEventListener('click', (e) => {
          const img = e.target.closest('.detail-cast-img');
          if (!img) return;
          const idx = parseInt(img.dataset.castIdx, 10);
          const c = castList[idx];
          if (!c || !c.photo) return;
          openWatchCastModal(c);
        });
      }

      // Render details info
      const detailsInfo = drama.details || {};
      const watchInfo = document.getElementById('watchInfo');
      if (watchInfo && Object.keys(detailsInfo).length) {
        const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        function fmtDate(str) {
          if (!str) return str;
          const d = new Date(str.replace(/\s*-+\s*$/, ''));
          if (isNaN(d.getTime())) return str.replace(/\s*-+\s*$/, '');
          return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        }
        const fields = [
          { key: 'network', label: 'Tayang di' },
          { key: 'director', label: 'Sutradara' },
          { key: 'writer', label: 'Penulis' },
          { key: 'genres', label: 'Genre' },
          { key: 'release_date', label: 'Rilis' },
          { key: 'runtime', label: 'Durasi' },
          { key: 'country', label: 'Negara' },
        ];
        const chips = fields
          .filter((f) => detailsInfo[f.key])
          .map((f) => {
            let value = detailsInfo[f.key].replace(/\s*-+\s*$/, '');
            if (f.key === 'release_date') value = fmtDate(value);
            return `<span class="detail-info-chip"><strong>${f.label}:</strong> ${value}</span>`;
          })
          .join('');
        if (chips) {
          watchInfo.innerHTML = chips;
          watchInfo.hidden = false;
        }
      }

      renderEpisodes();
      setWatchSkeleton(false);
      syncFavBtn();
      D.motion?.hideProgress?.();

      D.pushHistory({
        id: drama.id || dramaId,
        platform,
        title,
        cover: drama.cover || drama.coverWap || '',
        episodes: state.episodes.length,
      });
      window.refreshIcons?.();
    } catch (e) {
      D.motion?.hideProgress?.();
      setWatchSkeleton(false);
      const message = e.message || D.friendlyError?.() || D.t('player.drama_load_error');
      showWatchError(message);
      D.toast?.error?.(message);
    }
  }

  function normalizeStreamData(raw) {
    const data = D.unwrap(raw) || {};
    const url = data.videoUrl || data.url;
    const signedVideoUrl = data.proxiedVideoUrl || '';
    const ql = (data.qualityList || (url ? [{ label: 'auto', url, type: 'hls' }] : []))
      .map((quality) => {
        const rawQualityUrl = quality.rawUrl || quality.url || url;
        const type = quality.type || (isHlsUrl(rawQualityUrl) ? 'hls' : 'mp4');
        const proxiedUrl = quality.proxiedUrl || signedVideoUrl || '';
        const finalUrl = proxiedUrl || rawQualityUrl;
        return {
          ...quality,
          type,
          url: finalUrl,
          rawUrl: rawQualityUrl,
          _signedProxy: proxiedUrl,
          httpsUrl: quality.httpsUrl || data.httpsUrl || '',
          directUrl: quality.directUrl || data.directUrl || rawQualityUrl,
        };
      });
    return { data, qualities: ql, subtitles: data.subtitles || [] };
  }

  function getStream(ep) {
    if (!state.streamCache.has(ep)) {
      const promise = D.Platforms[platform].stream(dramaId, ep).then(normalizeStreamData);
      state.streamCache.set(ep, promise);
    }
    return state.streamCache.get(ep);
  }

  function bestStreamQuality(stream) {
    return stream?.qualities?.[0] || null;
  }

  function isHlsUrl(url, type) {
    return type === 'hls' || /\.m3u8(\?|$)/i.test(url || '');
  }

  function clearPrefetchLinks(keepKeys = new Set()) {
    state.prefetchLinks.forEach((link, key) => {
      if (keepKeys.has(key)) return;
      link.remove();
      state.prefetchLinks.delete(key);
    });
  }

  function warmStreamUrl(ep, quality) {
    if (!quality?.url || ep === state.currentEp) return;
    const finalUrl = maybeProxy(quality.url);
    const key = `${ep}:${finalUrl}`;
    clearPrefetchLinks(new Set([key]));

    if (!state.prefetchLinks.has(key)) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = finalUrl;
      if (isHlsUrl(quality.url, quality.type)) link.as = 'fetch';
      document.head.appendChild(link);
      state.prefetchLinks.set(key, link);
    }

    if (!isHlsUrl(quality.url, quality.type)) {
      if (!state.warmVideo) {
        state.warmVideo = document.createElement('video');
        state.warmVideo.muted = true;
        state.warmVideo.playsInline = true;
        state.warmVideo.preload = 'metadata';
        state.warmVideo.style.display = 'none';
      }
      if (state.warmVideo.src !== finalUrl) {
        state.warmVideo.src = finalUrl;
        state.warmVideo.load();
      }
    }
  }

  function pruneStreamCache(centerEp) {
    const keep = new Set([centerEp - 1, centerEp, centerEp + 1, centerEp + 2]);
    state.streamCache.forEach((_promise, ep) => {
      if (!keep.has(ep)) state.streamCache.delete(ep);
    });
  }

  function prefetchAround(ep) {
    // Adaptive prefetch berdasarkan kualitas jaringan
    const strategy = D.videoOpt ? D.videoOpt.getPreloadStrategy() : { prefetchCount: 2 };
    const isKdrama = platform === 'kdrama';
    const maxPrefetch = isKdrama ? Math.min(strategy.prefetchCount, 1) : strategy.prefetchCount;
    const candidates = [ep + 1, ep - 1, ep + 2, ep + 3].slice(0, maxPrefetch + 1);
    const nextAvailable = ep + 1 >= 1 && (!state.episodes.length || ep + 1 <= state.episodes.length);
    if (!nextAvailable) {
      clearPrefetchLinks();
      if (state.warmVideo) state.warmVideo.removeAttribute('src');
    }
    candidates.forEach((nextEp, idx) => {
      if (nextEp < 1 || (state.episodes.length && nextEp > state.episodes.length)) return;
      getStream(nextEp)
        .then((stream) => {
          if (idx === 0) warmStreamUrl(nextEp, bestStreamQuality(stream));
        })
        .catch(() => state.streamCache.delete(nextEp));
    });
    pruneStreamCache(ep);
  }

  async function loadStream(ep, opts = {}) {
    const seamless = Boolean(opts.seamless);
    const token = ++state.streamToken;
    if (!seamless || state.isInitialStream) {
      showWatchLoading(`${D.t('player.loading')} (Ep ${ep})`);
    }
    dom.epLabel.textContent = episodeLabel(ep);
    if (dom.epLabelMobile) dom.epLabelMobile.textContent = episodeLabel(ep);
    if (dom.epBadgeMobile) dom.epBadgeMobile.textContent = `Ep ${ep}`;
    state.triedProxy = false;
    try {
      const stream = await getStream(ep);
      if (token !== state.streamToken) return;
      const data = stream.data;
      state.qualities = stream.qualities;
      state.currentQuality = stream.qualities[0] || null;
      state.subtitles = stream.subtitles;

      dom.epLabel.textContent = episodeLabel(ep, data.epTitle);
      if (dom.epLabelMobile) dom.epLabelMobile.textContent = episodeLabel(ep, data.epTitle);

      if (dom.epSheetSub && state.episodes.length) {
        dom.epSheetSub.textContent = `Ep ${ep} · ${state.episodes.length} ${D.t('common.episodes')}`;
      }

      if (state.currentQuality) {
        const saved = readProgress();
        state.pendingResumeTime = saved?.ep === ep ? Number(saved.time || 0) : 0;
        if (state.pendingResumeTime > 12) {
          state.resumeToast?.dismiss?.();
          state.resumeToast = D.toast?.loading?.(`Menyiapkan lanjutan dari ${formatTime(state.pendingResumeTime)}...`, {
            id: 'watch-resume-loading',
          });
          showWatchLoading(`Melanjutkan dari ${formatTime(state.pendingResumeTime)}...`);
        }
        // Store signed proxy URL for maybeProxy/viaProxy fallback
        state._signedProxyUrl = state.currentQuality._signedProxy || '';
        setSrc(state.currentQuality.url, state.currentQuality.type, { seamless });
        if ((!seamless || state.isInitialStream) && state.pendingResumeTime <= 12) hideOverlay();
        state.isInitialStream = false;
        prefetchAround(ep);
      } else {
        showWatchError(D.t('player.episode_unavailable'));
        D.toast?.warning?.(D.t('player.episode_locked'));
      }
    } catch (e) {
      if (token !== state.streamToken) return;
      state.streamCache.delete(ep);
      const message = e.message || D.friendlyError?.() || D.t('player.video_load_error');
      showWatchError(message);
      D.toast?.error?.(message);
    }
  }

  // ── Events ─────────────────────────────────────────────────────
  dom.playPauseBtn?.addEventListener('click', togglePlay);
  dom.centerPlayBtn?.addEventListener('click', togglePlay);
  dom.rewindBtn?.addEventListener('click', () => seekBy(-10));
  dom.forwardBtn?.addEventListener('click', () => seekBy(10));
  dom.muteBtn?.addEventListener('click', () => {
    dom.video.muted = !dom.video.muted;
    updatePlayerControls();
  });
  dom.volumeBar?.addEventListener('input', () => {
    dom.video.volume = Number(dom.volumeBar.value);
    dom.video.muted = dom.video.volume === 0;
    updatePlayerControls();
  });
  dom.seekBar?.addEventListener('input', () => {
    state.seeking = true;
    const duration = Number.isFinite(dom.video.duration) ? dom.video.duration : 0;
    const pct = Number(dom.seekBar.value || 0) / 1000;
    dom.seekBar.style.setProperty('--progress', `${pct * 100}%`);
    if (dom.currentTimeLabel) dom.currentTimeLabel.textContent = formatTime(duration * pct);
  });
  dom.seekBar?.addEventListener('change', () => {
    const duration = Number.isFinite(dom.video.duration) ? dom.video.duration : 0;
    if (duration) dom.video.currentTime = duration * (Number(dom.seekBar.value || 0) / 1000);
    state.seeking = false;
    updatePlayerControls();
  });
  dom.speedBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dom.speedMenu) dom.speedMenu.hidden = !dom.speedMenu.hidden;
  });
  dom.speedMenu?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-rate]');
    if (!btn) return;
    state.playbackRate = Number(btn.dataset.rate) || 1;
    dom.video.playbackRate = state.playbackRate;
    dom.speedMenu.hidden = true;
    showSeekFeedback(0, `${Number(state.playbackRate).toFixed(2).replace(/\.?0+$/, '')}x`);
    updatePlayerControls();
  });
  document.addEventListener('click', (e) => {
    if (!dom.speedMenu || dom.speedMenu.hidden) return;
    if (!e.target.closest('#speedMenu, #speedBtn')) dom.speedMenu.hidden = true;
  });
  dom.pipBtn?.addEventListener('click', async () => {
    if (document.pictureInPictureElement) await exitPip();
    else await enterPip();
    state.autoPipActive = false;
    updateModeButtons();
  });
  dom.fullscreenBtn?.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => {
    document.body.classList.toggle('watch-fullscreen-active', Boolean(document.fullscreenElement));
    updateModeButtons();
  });
  dom.video.addEventListener('enterpictureinpicture', updateModeButtons);
  dom.video.addEventListener('leavepictureinpicture', () => {
    state.autoPipActive = false;
    updateModeButtons();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !dom.video.paused && !dom.video.ended) enterPip({ automatic: true });
    if (!document.hidden) exitPip({ automaticOnly: true });
  });
  window.addEventListener('blur', () => {
    if (!dom.video.paused && !dom.video.ended) enterPip({ automatic: true });
  });
  window.addEventListener('focus', () => exitPip({ automaticOnly: true }));

  dom.video.addEventListener('loadedmetadata', () => {
    dom.video.playbackRate = state.playbackRate;
    const resumeAt = Number(state.pendingResumeTime || 0);
    const duration = Number.isFinite(dom.video.duration) ? dom.video.duration : 0;
    if (resumeAt > 12 && (!duration || resumeAt < duration - 12)) {
      showWatchLoading(`Melanjutkan dari ${formatTime(resumeAt)}...`);
      dom.video.currentTime = resumeAt;
      D.toast?.info?.(D.t('player.resume_from', { time: formatTime(resumeAt), ep: state.currentEp }));
    }
    state.pendingResumeTime = 0;

    // ── Auto-adapt aspect ratio berdasarkan video dimensions ──
    const vw = dom.video.videoWidth;
    const vh = dom.video.videoHeight;
    if (vw && vh) {
      const ratio = vw / vh;
      if (ratio < 0.8) {
        // Portrait video (9:16, TikTok-style shorts)
        dom.playerInner.classList.remove('aspect-video');
        dom.playerInner.classList.add('aspect-vertical', 'max-w-[420px]');
        document.body.classList.add('is-vertical');
        document.body.classList.remove('is-horizontal');
      } else if (ratio >= 0.8 && ratio < 1.4) {
        // Square-ish or 4:3 video
        dom.playerInner.classList.remove('aspect-video', 'aspect-vertical', 'max-w-[420px]');
        dom.playerInner.style.aspectRatio = `${vw} / ${vh}`;
        document.body.classList.remove('is-vertical');
        document.body.classList.add('is-horizontal');
      } else {
        // Landscape (16:9 or wider) — default
        dom.playerInner.classList.remove('aspect-vertical', 'max-w-[420px]');
        dom.playerInner.classList.add('aspect-video');
        dom.playerInner.style.aspectRatio = '';
        document.body.classList.remove('is-vertical');
        document.body.classList.add('is-horizontal');
      }
      state._aspectApplied = true;
    }
    applyVideoAspect();
    updatePlayerControls();
  });
  dom.video.addEventListener('loadeddata', () => {
    clearTimeout(state.fallbackTimer);
    hideOverlay();
    state.resumeToast?.dismiss?.();
    state.resumeToast = null;

    // Fallback: jika loadedmetadata belum punya dimensions (HLS), cek lagi di sini
    const vw = dom.video.videoWidth;
    const vh = dom.video.videoHeight;
    if (vw && vh && !state._aspectApplied) {
      const ratio = vw / vh;
      if (ratio < 0.8) {
        dom.playerInner.classList.remove('aspect-video');
        dom.playerInner.classList.add('aspect-vertical', 'max-w-[420px]');
        document.body.classList.add('is-vertical');
        document.body.classList.remove('is-horizontal');
      } else if (ratio >= 0.8 && ratio < 1.4) {
        dom.playerInner.classList.remove('aspect-video', 'aspect-vertical', 'max-w-[420px]');
        dom.playerInner.style.aspectRatio = `${vw} / ${vh}`;
        document.body.classList.remove('is-vertical');
        document.body.classList.add('is-horizontal');
      } else {
        dom.playerInner.classList.remove('aspect-vertical', 'max-w-[420px]');
        dom.playerInner.classList.add('aspect-video');
        dom.playerInner.style.aspectRatio = '';
        document.body.classList.remove('is-vertical');
        document.body.classList.add('is-horizontal');
      }
      state._aspectApplied = true;
    }
    applyVideoAspect();
    updatePlayerControls();
  });
  dom.video.addEventListener('timeupdate', () => {
    updateTimeControls();
    if (dom.video.paused) return;
    if (!state.lastProgressSave || Date.now() - state.lastProgressSave > 5000) {
      state.lastProgressSave = Date.now();
      writeProgress();
    }
  });
  dom.video.addEventListener('error', () => {
    state.resumeToast?.dismiss?.();
    state.resumeToast = null;
    if (state.lastSrc && !state.triedProxy) {
      state.triedProxy = true;
      setSrc(state.lastSrc.url, state.lastSrc.type, { forceProxy: true });
    } else {
      showWatchError(D.t('player.video_play_error'));
    }
  });
  ['play', 'pause', 'volumechange', 'ratechange', 'durationchange', 'progress', 'seeking', 'seeked'].forEach((eventName) => {
    dom.video.addEventListener(eventName, updatePlayerControls);
  });
  dom.video.addEventListener('ended', autoNext);
  window.addEventListener('beforeunload', writeProgress);

  dom.prevBtn.addEventListener('click', () => {
    if (state.currentEp > 1) gotoEp(state.currentEp - 1);
  });
  dom.nextBtn.addEventListener('click', () => {
    if (state.currentEp < state.episodes.length) gotoEp(state.currentEp + 1);
  });
  dom.favBtn.addEventListener('click', () => {
    if (!state.drama) return;
    const added = D.toggleFavorite({
      id: state.drama.id || dramaId,
      platform,
      title: D.cleanTitle?.(state.drama.title || state.drama.bookName) || state.drama.title || state.drama.bookName || '—',
      cover: state.drama.cover || '',
      episodes: state.episodes.length,
    });
    syncFavBtn();
    const title = D.cleanTitle?.(state.drama.title || state.drama.bookName) || state.drama.title || state.drama.bookName || D.t('common.no_title');
    if (added) {
      D.toast?.success?.(D.t('common.favorite_added', { title }));
    } else {
      D.toast?.info?.(D.t('common.favorite_removed', { title }));
    }
  });

  // Mobile twin-buttons reuse the same handlers
  if (dom.prevBtnMobile) dom.prevBtnMobile.addEventListener('click', () => {
    if (state.currentEp > 1) gotoEp(state.currentEp - 1);
  });
  if (dom.nextBtnMobile) dom.nextBtnMobile.addEventListener('click', () => {
    if (state.currentEp < state.episodes.length) gotoEp(state.currentEp + 1);
  });
  if (dom.favBtnMobile) dom.favBtnMobile.addEventListener('click', () => {
    if (!state.drama) return;
    const added = D.toggleFavorite({
      id: state.drama.id || dramaId,
      platform,
      title: D.cleanTitle?.(state.drama.title || state.drama.bookName) || state.drama.title || state.drama.bookName || '—',
      cover: state.drama.cover || '',
      episodes: state.episodes.length,
    });
    syncFavBtn();
    const title = D.cleanTitle?.(state.drama.title || state.drama.bookName) || state.drama.title || state.drama.bookName || D.t('common.no_title');
    D.toast?.[added ? 'success' : 'info']?.(D.t(added ? 'common.favorite_added' : 'common.favorite_removed', { title }));
  });

  // ── Bottom-sheet daftar episode (mobile) ─────────────────────
  function openEpSheet() {
    if (!dom.epSheet) return;
    clearTimeout(hideTimer);
    setOverlayVisible(true);
    dom.epSheetBackdrop.classList.remove('hidden');
    requestAnimationFrame(() => dom.epSheet.classList.add('is-open'));
    scrollActiveEpIntoView();
  }
  function closeEpSheet(opts = {}) {
    if (!dom.epSheet) return;
    dom.epSheet.classList.remove('is-dragging');
    if (opts.fromDrag) {
      requestAnimationFrame(() => {
        dom.epSheet.style.transform = 'translateY(100%)';
        dom.epSheet.classList.remove('is-open');
      });
    } else {
      dom.epSheet.style.transform = '';
      dom.epSheet.classList.remove('is-open');
    }
    setTimeout(() => {
      dom.epSheetBackdrop.classList.add('hidden');
      dom.epSheet.style.transform = '';
    }, 280);
    scheduleHide();
  }
  if (dom.openEpSheetBtn) dom.openEpSheetBtn.addEventListener('click', openEpSheet);
  if (dom.epSheetCloseBtn) dom.epSheetCloseBtn.addEventListener('click', closeEpSheet);
  if (dom.epSheetBackdrop) dom.epSheetBackdrop.addEventListener('click', closeEpSheet);

  (function bindEpSheetPullDown() {
    if (!dom.epSheet) return;
    let startY = 0;
    let lastY = 0;
    let startTime = 0;
    let canDrag = false;
    let dragging = false;

    function resetDrag() {
      dom.epSheet.classList.remove('is-dragging');
      dom.epSheet.style.transform = '';
      dragging = false;
      canDrag = false;
    }

    dom.epSheet.addEventListener('touchstart', (e) => {
      if (!dom.epSheet.classList.contains('is-open') || e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      lastY = startY;
      startTime = Date.now();
      dragging = false;
      canDrag = Boolean(e.target.closest('.sheet-drag-zone')) || (dom.epSheetScroller?.scrollTop || 0) <= 0;
    }, { passive: true });

    dom.epSheet.addEventListener('touchmove', (e) => {
      if (!canDrag || e.touches.length !== 1) return;
      const currentY = e.touches[0].clientY;
      const dy = currentY - startY;
      lastY = currentY;
      if (dy <= 0) return;
      if (!e.target.closest('.sheet-drag-zone') && (dom.epSheetScroller?.scrollTop || 0) > 0) return;
      if (dy > 8) dragging = true;
      if (!dragging) return;
      e.preventDefault();
      dom.epSheet.classList.add('is-dragging');
      dom.epSheet.style.transform = `translateY(${Math.min(dy, window.innerHeight * 0.55)}px)`;
    }, { passive: false });

    dom.epSheet.addEventListener('touchend', () => {
      if (!dragging) {
        resetDrag();
        return;
      }
      const dy = Math.max(0, lastY - startY);
      const elapsed = Math.max(1, Date.now() - startTime);
      const velocity = dy / elapsed;
      if (dy > 90 || velocity > 0.55) {
        closeEpSheet({ fromDrag: true });
      } else {
        resetDrag();
      }
    }, { passive: true });

    dom.epSheet.addEventListener('touchcancel', resetDrag, { passive: true });
  })();

  // ── Swipe gesture ↑/↓ untuk ganti episode ────────────────────
  // Mendengarkan di player container supaya bisa di-swipe dari mana saja
  // (termasuk area tengah video). Tetap tidak menelan klik tombol.
  (function bindSwipe() {
    const target = dom.playerInner;
    if (!target) return;
    let sx = 0, sy = 0, st = 0, tracking = false;
    let wheelLock = false;
    const THRESHOLD_Y = 70;   // jarak minimum vertikal
    const MAX_OFFSET_X = 60;  // toleransi horizontal
    const MAX_DURATION = 800; // ms

    target.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      // Jangan menangkap swipe yang dimulai di tombol/anchor
      if (e.target.closest('button, a')) { tracking = false; return; }
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      st = Date.now();
      tracking = true;
    }, { passive: true });

    target.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      const dt = Date.now() - st;
      if (dt > MAX_DURATION) return;
      if (Math.abs(dx) > MAX_OFFSET_X) return;
      if (Math.abs(dy) < THRESHOLD_Y) return;

      hideSwipeHint();
      if (dy < 0) {
        // swipe up → episode berikutnya
        if (state.currentEp < state.episodes.length) gotoEp(state.currentEp + 1);
      } else {
        // swipe down → episode sebelumnya
        if (state.currentEp > 1) gotoEp(state.currentEp - 1);
      }
    }, { passive: true });

    target.addEventListener('wheel', (e) => {
      // Only trigger episode change via wheel on mobile immersive (no page scroll)
      // or when the page is not scrollable at the player position
      if (!document.body.classList.contains('is-watch')) return;
      if (window.matchMedia('(min-width: 768px)').matches) return;
      if (e.target.closest('button, a')) return;
      if (Math.abs(e.deltaY) < 35 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (wheelLock) return;
      wheelLock = true;
      hideSwipeHint();
      if (e.deltaY > 0 && state.currentEp < state.episodes.length) gotoEp(state.currentEp + 1);
      if (e.deltaY < 0 && state.currentEp > 1) gotoEp(state.currentEp - 1);
      setTimeout(() => { wheelLock = false; }, 650);
    }, { passive: false });
  })();

  function hideSwipeHint() {
    if (dom.swipeHint && !dom.swipeHint.classList.contains('hidden-fade')) {
      dom.swipeHint.classList.add('hidden-fade');
    }
  }

  // ── Auto-hide overlay saat playback ──────────────────────────
  // - Saat video diputar, top bar fade out otomatis setelah idle ~2.5 detik.
  // - Rail episode tetap aktif supaya user bisa ganti episode tanpa pause.
  // - Tap di area video memunculkan overlay kembali; tap kedua menyembunyikannya.
  // - Saat pause / loading, overlay selalu terlihat.
  const mobileOverlay = document.getElementById('mobileOverlay');
  let hideTimer = null;
  const IDLE_MS = 2500;

  function setOverlayVisible(visible) {
    mobileOverlay?.classList.toggle('is-hidden', !visible);
    dom.playerInner?.classList.toggle('controls-visible', visible);
    dom.playerInner?.classList.toggle('controls-hidden', !visible);
  }
  function showOverlayUI() {
    setOverlayVisible(true);
    scheduleHide();
  }
  function scheduleHide() {
    clearTimeout(hideTimer);
    if (dom.video.paused || dom.video.ended) return; // jangan auto-hide saat pause
    hideTimer = setTimeout(() => setOverlayVisible(false), IDLE_MS);
  }

  // Tap pada player → toggle overlay (kalau lagi tersembunyi → munculkan)
  if (dom.playerInner) {
    dom.playerInner.addEventListener('click', (e) => {
      if (e.target.closest('button, a, input')) {
        showOverlayUI();
        return;
      }
      const isHidden = dom.playerInner.classList.contains('controls-hidden');
      if (isHidden) {
        showOverlayUI();
      } else {
        if (!dom.video.paused) setOverlayVisible(false);
      }
    });
    ['mousemove', 'pointermove'].forEach((evt) => {
      dom.playerInner.addEventListener(evt, () => showOverlayUI(), { passive: true });
    });
  }

  // Sinkronkan dengan event video
  dom.video.addEventListener('play', () => { showOverlayUI(); });
  dom.video.addEventListener('playing', () => { scheduleHide(); });
  dom.video.addEventListener('pause', () => { clearTimeout(hideTimer); setOverlayVisible(true); });
  dom.video.addEventListener('ended', () => { clearTimeout(hideTimer); setOverlayVisible(true); });
  dom.video.addEventListener('seeking', () => { showOverlayUI(); });
  dom.video.addEventListener('waiting', () => { setOverlayVisible(true); });

  // Saat overlay disentuh (tap tombol / hover), reset timer biar nggak hilang mendadak
  ['touchstart', 'mousemove'].forEach((evt) => {
    mobileOverlay?.addEventListener(evt, () => {
      if (mobileOverlay.classList.contains('is-hidden')) return;
      scheduleHide();
    }, { passive: true });
    dom.controls?.addEventListener(evt, () => showOverlayUI(), { passive: true });
  });

  // Sembunyikan hint setelah beberapa detik atau saat user pertama kali tap player
  setTimeout(hideSwipeHint, 4500);
  setTimeout(() => {
    if (!dom.video.paused && !dom.video.ended) setOverlayVisible(false);
  }, 2400);
  dom.playerInner?.addEventListener('click', () => {
    setTimeout(hideSwipeHint, 1200);
  }, { once: true });

  // Keyboard shortcuts on watch page
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space' || e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'ArrowRight' && !(e.shiftKey || e.altKey)) {
      e.preventDefault();
      seekBy(10);
    } else if (e.key === 'ArrowLeft' && !(e.shiftKey || e.altKey)) {
      e.preventDefault();
      seekBy(-10);
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      dom.video.muted = !dom.video.muted;
      updatePlayerControls();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      dom.pipBtn?.click();
    } else if (e.key === 'ArrowRight' && (e.shiftKey || e.altKey)) {
      e.preventDefault();
      if (state.currentEp < state.episodes.length) gotoEp(state.currentEp + 1);
    } else if (e.key === 'ArrowLeft' && (e.shiftKey || e.altKey)) {
      e.preventDefault();
      if (state.currentEp > 1) gotoEp(state.currentEp - 1);
    }
  });

  // ── Init ───────────────────────────────────────────────────────
  (async function init() {
    // Jalankan detail dan stream secara paralel agar video lebih cepat mulai
    const streamPromise = loadStream(state.currentEp);
    await Promise.all([loadDetail(), streamPromise]);
  })();
})();
