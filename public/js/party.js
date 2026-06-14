/* =====================================================================
   Watch Party Room - Real-time synced playback + chat + participants.
   Uses Supabase Realtime for sync via Broadcast + Presence.
   ===================================================================== */
(function () {
  const D = window.DramSi;
  const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content
    || (typeof process !== 'undefined' ? '' : window.__SUPABASE_URL__ || '');

  // ── Get room ID from DOM ─────────────────────────────────────────────
  const roomRoot = document.getElementById('partyRoomRoot');
  const roomId = roomRoot?.dataset?.roomId;
  if (!roomId) {
    console.error('[Party] No room ID found');
    return;
  }

  // Check for invite code in URL
  const urlParams = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('invite') || '';

  // ── State ────────────────────────────────────────────────────────────
  const state = {
    room: null,
    drama: null,
    episodes: [],
    participants: [],
    userId: null,
    userName: '',
    userAvatar: null,
    isHost: false,
    channel: null,
    supabase: null,
    isConnected: false,
    playbackState: { status: 'paused', currentTime: 0, episode: 1 },
    hls: null,
    streamCache: new Map(),
    playbackRate: 1,
    seeking: false,
    heartbeatTimer: null,
    _streamLoadFailed: false,   // Track if last stream load failed (for retry-on-click)
    _isLoadingStream: false,    // Prevent concurrent stream loads
    reconnectAttempts: 0,
    maxReconnectAttempts: 10,
    lastSyncTime: 0,
    serverTimeOffset: 0,
    emaOffset: 0,             // Exponential moving average of server time offset
    emaSamples: 0,            // Number of samples collected for EMA
    isApplyingSync: false,
    syncGuardTimer: null,     // Delayed clearing of isApplyingSync flag
    syncDebounceTimer: null,  // Debounce timer for incoming sync events
    pendingSyncEvent: null,   // Latest pending sync event to apply after debounce
    syncState: 'connecting',  // 'connected' | 'buffering' | 'syncing' | 'connecting' | 'disconnected'
    isBuffering: false,
    bufferingTimer: null,     // Grace period timer before showing buffering UI
    lastBroadcastTimes: {},   // Per-event-type broadcast throttle timestamps
    pendingSeekBroadcast: null, // Debounced seek broadcast timer
    driftCheckTimer: null,    // Periodic drift check interval
    chatMessages: [],
    maxChatMessages: 200,
    seenPresenceKeys: new Set(), // Track seen presences to avoid duplicate join notifications
  };

  // ── DOM References ───────────────────────────────────────────────────
  const dom = {
    roomTitle: document.getElementById('partyRoomTitle'),
    roomCode: document.getElementById('partyRoomCode'),
    syncStatus: document.getElementById('partySyncStatus'),
    video: document.getElementById('partyVideo'),
    overlay: document.getElementById('partyPlayerOverlay'),
    overlayText: document.getElementById('partyOverlayText'),
    centerPlayBtn: document.getElementById('partyCenterPlayBtn'),
    controls: document.getElementById('partyControls'),
    playPauseBtn: document.getElementById('partyPlayPauseBtn'),
    rewindBtn: document.getElementById('partyRewindBtn'),
    forwardBtn: document.getElementById('partyForwardBtn'),
    muteBtn: document.getElementById('partyMuteBtn'),
    volumeBar: document.getElementById('partyVolumeBar'),
    seekBar: document.getElementById('partySeekBar'),
    currentTime: document.getElementById('partyCurrentTime'),
    duration: document.getElementById('partyDuration'),
    speedBtn: document.getElementById('partySpeedBtn'),
    speedMenu: document.getElementById('partySpeedMenu'),
    epBtn: document.getElementById('tabEpisodeBtn'),
    epList: document.getElementById('partyEpList'),
    epText: document.getElementById('partyEpisodeText'),
    fullscreenBtn: document.getElementById('partyFullscreenBtn'),
    syncOverlay: document.getElementById('partySyncOverlay'),
    syncMessage: document.getElementById('partySyncMessage'),
    seekFeedback: document.getElementById('partySeekFeedback'),
    episodeText: document.getElementById('partyEpisodeText'),
    participantsList: document.getElementById('participantsList'),
    participantCount: document.getElementById('participantCount'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    btnSendChat: document.getElementById('btnSendChat'),
    btnInvite: document.getElementById('btnInvite'),
    btnLeaveRoom: document.getElementById('btnLeaveRoom'),
    inviteModal: document.getElementById('inviteModal'),
    btnCloseInvite: document.getElementById('btnCloseInvite'),
    btnCopyCode: document.getElementById('btnCopyCode'),
    btnCopyLink: document.getElementById('btnCopyLink'),
    inviteRoomCode: document.getElementById('inviteRoomCode'),
    inviteLinkInput: document.getElementById('inviteLinkInput'),
    leaveModal: document.getElementById('leaveModal'),
    btnCancelLeave: document.getElementById('btnCancelLeave'),
    btnConfirmLeave: document.getElementById('btnConfirmLeave'),
    btnSyncAll: document.getElementById('btnSyncAll'),
    playerInner: document.getElementById('partyPlayerInner'),
    roomGrid: document.getElementById('partyRoomGrid'),
    btnToggleSidebarDesktop: document.getElementById('btnToggleSidebarDesktop'),
    btnReopenSidebar: document.getElementById('btnReopenSidebar'),
    countdown: document.getElementById('partyCountdown'),
    countdownText: document.getElementById('partyCountdownText'),
    expiredOverlay: document.getElementById('partyExpiredOverlay'),
    expiredCountdown: document.getElementById('partyExpiredCountdown'),
    bufferingOverlay: document.getElementById('partyBufferingOverlay'),
    // Sidebar mobile
    sidebar: document.getElementById('partySidebar'),
    sidebarTabs: document.getElementById('sidebarTabs'),
    participantsPanel: document.getElementById('participantsPanel'),
    chatPanel: document.getElementById('chatPanel'),
    btnToggleSidebar: document.getElementById('btnToggleSidebar'),
    btnCloseSidebar: document.getElementById('btnCloseSidebar'),
    participantCountTab: document.getElementById('participantCountTab'),
    chatUnreadBadge: document.getElementById('chatUnreadBadge'),
    sidebarToggleBadge: document.getElementById('sidebarToggleBadge'),
  };

  // ── Helpers ──────────────────────────────────────────────────────────

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function generateMessageId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Track current icon per button to avoid redundant DOM updates
  const _iconCache = new WeakMap();

  function setIcon(button, iconName, className = 'h-5 w-5', skipRefresh = false) {
    if (!button) return false;
    const cacheKey = `${iconName}|${className}`;
    if (_iconCache.get(button) === cacheKey) return false;
    _iconCache.set(button, cacheKey);
    button.innerHTML = `<i data-lucide="${iconName}" class="${className}"></i>`;
    if (!skipRefresh) window.refreshIcons?.();
    return true;
  }

  function showOverlay(text) {
    dom.overlay?.classList.remove('hidden');
    // Toggle error state: show text only for errors, just spinner for loading
    const isError = text && (
      text.includes('Gagal') || text.includes('tidak tersedia') || text.includes('HLS') ||
      text.includes('Server') || text.includes('error') || text.includes('Error')
    );
    dom.overlay?.classList.toggle('is-error', !!isError);
    if (text && dom.overlayText) dom.overlayText.textContent = text;

    // Add retry button for errors (dynamically, if not already present)
    if (isError && dom.overlay && !dom.overlay.querySelector('.party-overlay-retry')) {
      const retryBtn = document.createElement('button');
      retryBtn.className = 'party-overlay-retry';
      retryBtn.textContent = 'Coba Lagi';
      retryBtn.addEventListener('click', () => {
        retryBtn.remove();
        if (state.room) {
          state._isLoadingStream = false; // Reset guard
          state._videoRetryCount = 0;     // Reset retry counter
          loadStream(state.room.current_episode);
        }
      });
      dom.overlay.appendChild(retryBtn);
    } else if (!isError && dom.overlay) {
      // Remove retry button when showing loading state
      dom.overlay.querySelector('.party-overlay-retry')?.remove();
    }
  }

  function hideOverlay() {
    dom.overlay?.classList.add('hidden');
  }

  function showSyncToast(message, duration = 2000) {
    if (!dom.syncOverlay || !dom.syncMessage) return;
    dom.syncMessage.textContent = message;
    dom.syncOverlay.style.display = '';
    clearTimeout(state._syncToastTimer);
    state._syncToastTimer = setTimeout(() => {
      dom.syncOverlay.style.display = 'none';
    }, duration);
  }

  function updateSyncStatus(status) {
    if (!dom.syncStatus) return;
    // Avoid redundant updates
    if (state.syncState === status && status !== 'syncing') return;
    state.syncState = status;

    dom.syncStatus.className = 'party-sync-indicator';
    if (status === 'connected') {
      dom.syncStatus.classList.add('party-sync-connected');
      dom.syncStatus.querySelector('span:last-child').textContent = 'Tersinkronisasi';
    } else if (status === 'syncing') {
      dom.syncStatus.classList.add('party-sync-syncing');
      dom.syncStatus.querySelector('span:last-child').textContent = 'Menyelaraskan...';
      // Auto-revert to connected after correction period
      clearTimeout(state._syncRevertTimer);
      state._syncRevertTimer = setTimeout(() => {
        if (state.syncState === 'syncing') updateSyncStatus('connected');
      }, 1500);
    } else if (status === 'buffering') {
      dom.syncStatus.classList.add('party-sync-buffering');
      dom.syncStatus.querySelector('span:last-child').textContent = 'Memuat...';
    } else if (status === 'disconnected') {
      dom.syncStatus.classList.add('party-sync-disconnected');
      dom.syncStatus.querySelector('span:last-child').textContent = 'Terputus';
    } else {
      dom.syncStatus.classList.add('party-sync-connecting');
      dom.syncStatus.querySelector('span:last-child').textContent = 'Menghubungkan...';
    }
  }

  function showBuffering() {
    if (state.isBuffering) return;
    state.isBuffering = true;
    // Grace period: only show overlay if buffering lasts > 500ms
    clearTimeout(state.bufferingTimer);
    state.bufferingTimer = setTimeout(() => {
      if (state.isBuffering && dom.bufferingOverlay) {
        dom.bufferingOverlay.classList.add('is-visible');
      }
    }, 500);
    // Update sync indicator to buffering (immediate, no grace period)
    if (state.isConnected) {
      updateSyncStatus('buffering');
    }
  }

  function hideBuffering() {
    state.isBuffering = false;
    clearTimeout(state.bufferingTimer);
    state.bufferingTimer = null;
    if (dom.bufferingOverlay) {
      dom.bufferingOverlay.classList.remove('is-visible');
    }
    // Restore connected status if we were in buffering state
    if (state.syncState === 'buffering' && state.isConnected) {
      updateSyncStatus('connected');
    }
  }

  /**
   * Show a custom confirm modal. Returns a Promise<boolean>.
   * Replaces browser confirm() with a styled modal.
   */
  function showConfirmModal(title, message, confirmText = 'Ya', confirmClass = 'party-btn-danger') {
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'party-modal-backdrop';
      backdrop.innerHTML = `
        <div class="party-modal party-modal-sm" role="dialog" aria-modal="true">
          <div class="party-modal-header">
            <h3 class="party-modal-title">${escapeHtml(title)}</h3>
          </div>
          <div class="party-modal-body">
            <p>${escapeHtml(message)}</p>
          </div>
          <div class="party-modal-footer">
            <button class="party-btn party-btn-ghost" data-action="cancel">Batal</button>
            <button class="party-btn ${confirmClass}" data-action="confirm">${escapeHtml(confirmText)}</button>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);
      requestAnimationFrame(() => backdrop.classList.add('is-visible'));

      function cleanup(result) {
        backdrop.classList.remove('is-visible');
        setTimeout(() => backdrop.remove(), 200);
        resolve(result);
      }

      backdrop.querySelector('[data-action="cancel"]').addEventListener('click', () => cleanup(false));
      backdrop.querySelector('[data-action="confirm"]').addEventListener('click', () => cleanup(true));
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) cleanup(false); });
    });
  }

  // ── Initialize Supabase Client ───────────────────────────────────────

  async function initSupabase() {
    // Read Supabase config injected by PartyRoomView.tsx
    const supabaseUrl = roomRoot?.dataset?.supabaseUrl || '';
    const supabaseKey = roomRoot?.dataset?.supabaseKey || '';

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Party] Supabase config not found on page element');
      return false;
    }

    // Dynamically import supabase-js from CDN
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      state.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: true, autoRefreshToken: true },
        realtime: { params: { eventsPerSecond: 30 } },
      });
    } catch (err) {
      console.error('[Party] Failed to load Supabase JS:', err);
      return false;
    }

    // Get current user session
    try {
      const { data: { user } } = await state.supabase.auth.getUser();
      if (user) {
        state.userId = user.id;
        state.userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Pengguna';
        state.userAvatar = user.user_metadata?.avatar_url || null;
        return true;
      }
    } catch (err) {
      console.error('[Party] Supabase getUser error:', err);
    }

    // Fallback: try session endpoint
    try {
      const res = await fetch('/api/auth/session', { headers: { accept: 'application/json' } });
      const sessionData = await res.json();
      if (sessionData.user) {
        state.userId = sessionData.user.id;
        state.userName = sessionData.user.name || 'Pengguna';
        state.userAvatar = sessionData.user.avatarUrl || null;
        return true;
      }
    } catch (err) {
      console.error('[Party] Failed to get user session:', err);
    }

    return false;
  }

  // ── Join Room via API ────────────────────────────────────────────────

  async function joinRoomApi() {
    try {
      const res = await fetch(`/api/party/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ invite_code: inviteCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal bergabung ke room');
      }

      state.room = data.room;
      state.playbackState = data.room.playback_state || { status: 'paused', currentTime: 0, episode: 1 };
      state.isHost = data.participant?.role === 'host';

      // Update user info if not set
      if (!state.userId) {
        state.userId = data.participant?.user_id;
        state.userName = data.participant?.display_name || 'Pengguna';
      }

      updateRoomUI();

      // Show success toast for non-host joiners
      if (!state.isHost) {
        if (!sessionStorage.getItem('party_joined_' + roomId)) {
          D.toast?.success?.('Berhasil Bergabung', { description: `Room: ${data.room.title}`, duration: 4000 });
          sessionStorage.setItem('party_joined_' + roomId, 'true');
        }
      }

      return true;
    } catch (err) {
      console.error('[Party] Join room error:', err);
      D.toast?.error?.('Gagal Bergabung', { description: err.message });
      return false;
    }
  }

  // ── Get Room State ───────────────────────────────────────────────────

  async function fetchRoomState() {
    try {
      const res = await fetch(`/api/party/rooms/${roomId}`, {
        headers: { accept: 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal memuat room');
      }

      const data = await res.json();
      state.room = data.room;
      state.participants = data.participants || [];
      state.playbackState = data.room.playback_state || state.playbackState;
      state.isHost = state.participants.some(p => p.user_id === state.userId && p.role === 'host');

      // Check if room was deactivated/expired
      if (!state.room.is_active) {
        showRoomClosedMessage('Room sudah ditutup atau kedaluwarsa.');
        return false;
      }

      // Check expiry client-side
      if (state.room.expires_at && new Date(state.room.expires_at) < new Date()) {
        showRoomClosedMessage('Room sudah kedaluwarsa.');
        return false;
      }

      updateRoomUI();
      updateParticipantsUI();
      return true;
    } catch (err) {
      console.error('[Party] Fetch room state error:', err);
      // If error message indicates room closed/expired
      if (err.message && (err.message.includes('ditutup') || err.message.includes('kedaluwarsa'))) {
        showRoomClosedMessage(err.message);
        return false;
      }
      return false;
    }
  }

  function showRoomClosedMessage(message) {
    showOverlay(message);
    D.toast?.info?.('Room Ditutup', { description: message });
    setTimeout(() => { window.location.href = '/party'; }, 3000);
  }

  // ── Update UI Functions ──────────────────────────────────────────────

  function updateRoomUI() {
    if (!state.room) return;

    if (dom.roomTitle) dom.roomTitle.textContent = state.room.title;
    if (dom.roomCode) {
      dom.roomCode.querySelector('span:last-child').textContent = state.room.code;
    }

    // Hide invite button for non-host
    if (dom.btnInvite) {
      dom.btnInvite.style.display = state.isHost ? '' : 'none';
    }
    // Host status updated (UI changes if any)

    // Update episode info
    const currentEp = state.room.current_episode;
    if (dom.episodeText) {
      dom.episodeText.textContent = state.episodes.length
        ? `Episode ${currentEp} / ${state.episodes.length}`
        : `Episode ${currentEp}`;
    }

    // Update header episode badge
    const headerEp = document.getElementById('partyHeaderEpisode');
    if (headerEp && state.room.content_type === 'series') {
      headerEp.style.display = '';
      const headerEpSpan = headerEp.querySelector('span');
      if (headerEpSpan) headerEpSpan.textContent = `Ep ${currentEp}`;
    } else if (headerEp) {
      headerEp.style.display = 'none';
    }

    // Sync episode button active states
    if (dom.epList) {
      dom.epList.querySelectorAll('.party-ep-btn').forEach(btn => {
        const epNum = parseInt(btn.textContent, 10);
        btn.classList.toggle('active', epNum === currentEp);
      });
    }

    window.refreshIcons?.();
  }

  function updateParticipantsUI() {
    if (!dom.participantsList) return;

    const count = state.participants.length;
    if (dom.participantCount) dom.participantCount.textContent = count;
    if (dom.participantCountTab) dom.participantCountTab.textContent = count;

    const html = state.participants.map(p => {
      const isMe = p.user_id === state.userId;
      const isHost = p.role === 'host';
      const statusClass = p.status === 'active' ? 'participant-active' :
        p.status === 'paused' ? 'participant-paused' : 'participant-idle';

      return `
        <div class="participant-item ${isMe ? 'participant-me' : ''}">
          <div class="participant-avatar ${statusClass}">
            ${p.avatar_url ? `<img src="${p.avatar_url}" alt="${escapeHtml(p.display_name)}" />` :
              `<span>${(p.display_name || '?')[0].toUpperCase()}</span>`}
          </div>
          <div class="participant-info">
            <span class="participant-name">${escapeHtml(p.display_name)}${isMe ? ' (Anda)' : ''}</span>
            <span class="participant-role">${isHost ? 'Host' : p.role}</span>
          </div>
          ${isHost ? '<i data-lucide="crown" class="h-4 w-4 participant-crown"></i>' : ''}
          ${state.isHost && !isMe ? `<button class="participant-kick-btn" data-user-id="${p.user_id}" aria-label="Keluarkan"><i data-lucide="x" class="h-3 w-3"></i></button>` : ''}
        </div>
      `;
    }).join('');

    dom.participantsList.innerHTML = html;

    // Bind kick buttons
    dom.participantsList.querySelectorAll('.participant-kick-btn').forEach(btn => {
      btn.addEventListener('click', () => kickParticipant(btn.dataset.userId));
    });

    window.refreshIcons?.();
  }

  function updatePlayerControls() {
    const video = dom.video;
    if (!video) return;

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const current = Number.isFinite(video.currentTime) ? video.currentTime : 0;

    if (!state.seeking && dom.seekBar) {
      dom.seekBar.value = duration ? String(Math.round((current / duration) * 1000)) : '0';
      dom.seekBar.style.setProperty('--progress', `${duration ? (current / duration) * 100 : 0}%`);
    }

    if (dom.currentTime) dom.currentTime.textContent = formatTime(current);
    if (dom.duration) dom.duration.textContent = formatTime(duration);

    // Batch icon updates: skip individual refreshIcons calls, do one at the end
    let iconChanged = false;
    iconChanged = setIcon(dom.playPauseBtn, video.paused ? 'play' : 'pause', 'h-5 w-5', true) || iconChanged;
    iconChanged = setIcon(dom.centerPlayBtn, video.paused ? 'play' : 'pause', 'h-9 w-9', true) || iconChanged;

    const isMuted = video.muted || video.volume === 0;
    const volumeIcon = isMuted ? 'volume-x' : video.volume < 0.5 ? 'volume-1' : 'volume-2';
    iconChanged = setIcon(dom.muteBtn, volumeIcon, 'h-5 w-5', true) || iconChanged;

    // Single DOM refresh for all icon changes
    if (iconChanged) window.refreshIcons?.();

    if (dom.speedBtn) {
      dom.speedBtn.textContent = `${Number(video.playbackRate).toFixed(2).replace(/\.?0+$/, '')}x`;
    }
  }

  // ── Video Playback ───────────────────────────────────────────────────

  // HLS.js config for fast startup and smooth playback (Google Meet style)
  const HLS_CONFIG = {
    enableWorker: true,
    lowLatencyMode: true,            // Enable low latency mode for live-like sync
    maxBufferLength: 30,             // Lower buffer to adapt quality faster on mobile
    maxMaxBufferLength: 60,
    maxBufferSize: 60 * 1000 * 1000,
    maxBufferHole: 0.5,
    startFragPrefetch: true,
    startLevel: -1,                 // Auto quality from start
    abrEwmaDefaultEstimate: 500000, // 500kbps default to start instantly without buffering
    appendErrorMaxRetry: 10,
    liveSyncDurationCount: 3,
    liveMaxLatencyDurationCount: 10,
    backBufferLength: 60,
    fragLoadingTimeOut: 30000,      // 30s timeout per fragment
    manifestLoadingTimeOut: 20000,  // 20s timeout for manifest
    levelLoadingTimeOut: 20000,     // 20s timeout for level
    fragLoadingMaxRetry: 10,         // More retries per fragment
    manifestLoadingMaxRetry: 6,
    levelLoadingMaxRetry: 6,
    fragLoadingRetryDelay: 1000,    // 1s between retries
    progressive: true,              // Progressive loading for faster startup
  };

  function setVideoSource(url, type) {
    const video = dom.video;
    if (!video || !url) return;

    if (state.hls) {
      state.hls.destroy();
      state.hls = null;
    }

    const isHls = type === 'hls' || /\.m3u8(\?|$)/i.test(url);

    if (isHls) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls(HLS_CONFIG);
        hls.loadSource(url);
        hls.attachMedia(video);
        state.hls = hls;
      } else {
        // Try to dynamically load HLS.js
        console.warn('[Party] HLS.js not available, attempting dynamic load...');
        loadHlsLib().then(() => {
          if (window.Hls && window.Hls.isSupported()) {
            const hls = new window.Hls(HLS_CONFIG);
            hls.loadSource(url);
            hls.attachMedia(video);
            state.hls = hls;
          } else {
            video.src = url;
          }
        }).catch(() => {
          video.src = url;
        });
        return;
      }
    } else {
      video.src = url;
    }

    video.preload = 'auto';
    video.load();
  }

  /** Dynamically load HLS.js from CDN */
  function loadHlsLib() {
    if (window.Hls) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load HLS.js'));
      document.head.appendChild(script);
    });
  }

  async function loadStream(episode) {
    if (!state.room) return;

    // Concurrency guard — prevent multiple simultaneous loadStream calls
    if (state._isLoadingStream) {
      console.warn('[Party] loadStream already in progress, skipping');
      return;
    }
    state._isLoadingStream = true;

    showOverlay('Memuat video...');
    state._streamLoadFailed = false;
    state._videoRetryCount = 0; // Reset video element retry counter

    // Clean up previous HLS instance before loading new stream
    if (state.hls) {
      state.hls.destroy();
      state.hls = null;
    }

    try {
      const platform = state.room.platform;
      const contentId = state.room.content_id;
      const platformConfig = D.Platforms?.[platform];

      if (!platformConfig) {
        throw new Error('Platform tidak didukung');
      }

      // Retry logic: attempt up to 5 times with exponential backoff
      let stream = null;
      let lastError = null;
      const maxAttempts = 5;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await platformConfig.stream(contentId, episode);
          const data = D.unwrap(res) || {};
          const videoUrl = data.videoUrl || data.url;

          if (videoUrl) {
            stream = { data, videoUrl };
            break; // Success
          }
          lastError = new Error('Video URL tidak ditemukan dalam respons');
          console.warn(`[Party] Stream attempt ${attempt}/${maxAttempts}: no video URL`);
        } catch (err) {
          lastError = err;
          console.warn(`[Party] Stream attempt ${attempt}/${maxAttempts} failed:`, err.message);
        }

        if (attempt < maxAttempts) {
          // Exponential backoff: 1s, 2s, 4s, 8s
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        }
      }

      if (!stream || !stream.videoUrl) {
        state._streamLoadFailed = true;
        const errMsg = lastError?.message || '';
        if (errMsg.includes('ENOTFOUND') || errMsg.includes('tidak dapat dihubungi') || errMsg.includes('502')) {
          showOverlay('Server video tidak tersedia, coba lagi nanti');
        } else {
          showOverlay('Gagal memuat video');
        }
        return;
      }

      const isHls = /\.m3u8(\?|$)/i.test(stream.videoUrl);

      // Ensure HLS.js is loaded before setting source (for non-Safari browsers)
      if (isHls && !window.Hls && !dom.video?.canPlayType('application/vnd.apple.mpegurl')) {
        console.warn('[Party] HLS.js not loaded, loading from CDN...');
        try {
          await loadHlsLib();
        } catch (loadErr) {
          console.error('[Party] Failed to load HLS.js:', loadErr);
          // Fallback: try direct src anyway
        }
      }

      setVideoSource(stream.videoUrl, isHls ? 'hls' : 'mp4');

      // Setup HLS error handling for auto-recovery
      if (state.hls) {
        state.hls.on(window.Hls.ErrorTypes.MEDIA_ERROR, () => {
          console.warn('[Party] HLS media error, recovering...');
          state.hls?.recoverMediaError();
        });
        state.hls.on(window.Hls.ErrorTypes.NETWORK_ERROR, (event, data) => {
          console.warn('[Party] HLS network error:', data?.details);
          if (data?.fatal) {
            state.hls?.destroy();
            state.hls = null;
            console.log('[Party] Fatal HLS network error, retrying stream in 3s...');
            setTimeout(() => {
              state._isLoadingStream = false; // Reset guard before retry
              loadStream(episode);
            }, 3000);
          }
        });
        state.hls.on(window.Hls.Events.ERROR, (event, data) => {
          if (data?.details === 'bufferStalledError' || data?.details === 'bufferNudgeOnStalled') {
            console.warn('[Party] HLS buffer stalled, attempting quality downgrade...');
            if (state.hls && state.hls.levels && state.hls.levels.length > 1) {
              const currentLevel = state.hls.currentLevel;
              if (currentLevel > 0) {
                state.hls.currentLevel = currentLevel - 1;
                console.log('[Party] Downgraded HLS quality to level', state.hls.currentLevel);
              }
            }
          }
        });
      }
    } catch (err) {
      console.error('[Party] Load stream error:', err);
      state._streamLoadFailed = true;
      const errMsg = err?.message || '';
      if (errMsg.includes('ENOTFOUND') || errMsg.includes('tidak dapat dihubungi') || errMsg.includes('502')) {
        showOverlay('Server video tidak tersedia, coba lagi nanti');
      } else {
        showOverlay('Gagal memuat video');
      }
    } finally {
      state._isLoadingStream = false;
    }
  }

  // ── Playback Sync ────────────────────────────────────────────────────

  function getServerNow() {
    return Date.now() + state.serverTimeOffset;
  }

  /**
   * Update server time offset using Exponential Moving Average (EMA).
   * Smooths out network jitter for stable time calculations.
   */
  function updateServerTimeOffset(remoteTimestamp) {
    const localNow = Date.now();
    const rawOffset = remoteTimestamp - localNow;
    const alpha = state.emaSamples < 5 ? 0.5 : 0.15; // Faster convergence initially
    state.emaOffset = alpha * rawOffset + (1 - alpha) * state.emaOffset;
    state.serverTimeOffset = Math.round(state.emaOffset);
    state.emaSamples++;
  }

  /**
   * Broadcast playback event with throttling.
   * Minimum interval between same-type broadcasts to prevent flooding.
   */
  function broadcastPlayback(action, payload) {
    if (!state.channel) return;

    // Throttle: skip if same action was broadcast < 80ms ago (except seek which has its own debounce)
    const now = Date.now();
    const lastTime = state.lastBroadcastTimes[action] || 0;

    if (action === 'seek') {
      // Debounce seek broadcasts: cancel pending if new seek within 150ms (scrubbing)
      clearTimeout(state.pendingSeekBroadcast);
      state.pendingSeekBroadcast = setTimeout(() => {
        state.lastBroadcastTimes.seek = Date.now();
        _sendBroadcast(action, payload);
      }, 150);
      return;
    }

    if (now - lastTime < 80) return; // Throttle
    state.lastBroadcastTimes[action] = now;
    _sendBroadcast(action, payload);
  }

  function _sendBroadcast(action, payload) {
    if (!state.channel) return;
    state.channel.send({
      type: 'broadcast',
      event: `playback:${action}`,
      payload: {
        ...payload,
        updatedAt: getServerNow(),
        updatedBy: state.userId,
      },
    });
  }

  /**
   * Debounced sync event application.
   * Queues incoming events and applies only the latest after a 30ms window.
   */
  function queueSyncEvent(event, payload) {
    state.pendingSyncEvent = { event, payload };
    clearTimeout(state.syncDebounceTimer);
    state.syncDebounceTimer = setTimeout(() => {
      const pending = state.pendingSyncEvent;
      state.pendingSyncEvent = null;
      if (pending) {
        applySyncEvent(pending.event, pending.payload);
      }
    }, 30);
  }

  function applySyncEvent(event, payload) {
    if (!dom.video) return;

    // Set sync guard — prevents local event handlers from re-broadcasting
    state.isApplyingSync = true;
    clearTimeout(state.syncGuardTimer);
    state.syncGuardTimer = setTimeout(() => {
      state.isApplyingSync = false;
    }, 2000);

    // Update EMA with remote timestamp if available
    if (payload.updatedAt) {
      updateServerTimeOffset(payload.updatedAt);
    }

    const video = dom.video;
    const targetTime = payload.currentTime || 0;
    const eventTime = payload.updatedAt || getServerNow();
    const elapsed = (getServerNow() - eventTime) / 1000;
    const adjustedTime = targetTime + (elapsed * (state.playbackRate || 1));
    const currentVideoTime = video.currentTime || 0;
    const drift = Math.abs(currentVideoTime - adjustedTime);

    // Apply play/pause state
    if (event === 'play') {
      if (video.paused) {
        video.currentTime = adjustedTime;
        video.play().catch(() => {});
      } else if (drift > 0.8) {
        // Correct drift > 0.8s during playback
        applyDriftCorrection(adjustedTime, drift);
        updateSyncStatus('syncing');
      }
      // Skip correction if drift <= 0.8s — playback is close enough
    } else if (event === 'pause') {
      if (!video.paused) video.pause();
      if (drift > 0.3) {
        video.currentTime = adjustedTime;
        updateSyncStatus('syncing');
      }
    } else if (event === 'seek') {
      video.currentTime = adjustedTime;
      updatePlayerControls();
      updateSyncStatus('syncing');
    } else if (event === 'speed') {
      state.playbackRate = payload.rate || 1;
      video.playbackRate = state.playbackRate;
    } else if (event === 'episode') {
      const newEp = payload.episode;
      if (state.room.current_episode !== newEp) {
        state.room.current_episode = newEp;
        state.playbackState.episode = newEp;
        if (dom.episodeText) {
          dom.episodeText.textContent = state.episodes.length
            ? `Episode ${newEp} / ${state.episodes.length}`
            : `Episode ${newEp}`;
        }

        // Update header episode badge
        const headerEp = document.getElementById('partyHeaderEpisode');
        if (headerEp) {
          headerEp.style.display = '';
          const headerEpSpan = headerEp.querySelector('span');
          if (headerEpSpan) headerEpSpan.textContent = `Ep ${newEp}`;
        }

        showSyncToast(`Episode diubah ke ${newEp}`);
        loadStream(newEp);
        setTimeout(() => {
          if (dom.video) {
            dom.video.currentTime = adjustedTime || 0;
            if (payload.status === 'playing') {
              dom.video.play().catch(() => {});
            }
          }
        }, 1500);
        // Update active state on ep buttons
        dom.epList?.querySelectorAll('.party-ep-btn').forEach(btn => {
          const epNum = parseInt(btn.textContent, 10);
          btn.classList.toggle('active', epNum === newEp);
        });
      }
    }

    state.lastSyncTime = Date.now();
  }

  function applyDriftCorrection(targetTime, drift) {
    const video = dom.video;
    if (!video) return;

    clearTimeout(state._driftCorrectionTimer);

    if (drift > 2.5) {
      // Direct seek to strictly maintain real-time sync without altering playback speed
      state.isApplyingSync = true;
      clearTimeout(state.syncGuardTimer);
      state.syncGuardTimer = setTimeout(() => {
        state.isApplyingSync = false;
      }, 2000);

      video.currentTime = targetTime;
      // Ensure playback rate stays at user's setting
      video.playbackRate = state.playbackRate;
      console.log('[Party] Drift correction: direct seek, drift=', drift.toFixed(1) + 's');
    }
  }

  /**
   * Periodic drift check via lightweight ping/pong.
   * Every 4s during active playback, broadcasts current time.
   * Peers respond with their time, enabling proactive drift detection.
   */
  function startPeriodicDriftCheck() {
    if (state.driftCheckTimer) clearInterval(state.driftCheckTimer);

    state.driftCheckTimer = setInterval(() => {
      if (!state.isConnected || !state.channel || !dom.video) return;
      if (dom.video.paused || dom.video.ended) return;

      // Broadcast lightweight ping with current position
      state.channel.send({
        type: 'broadcast',
        event: 'playback:ping',
        payload: {
          currentTime: dom.video.currentTime,
          isPlaying: !dom.video.paused,
          episode: state.room?.current_episode || 1,
          updatedAt: getServerNow(),
          from: state.userId,
        },
      });
    }, 4000);
  }

  // ── Chat System ──────────────────────────────────────────────────────

  let chatUnreadCount = 0;
  let activeSidebarTab = 'participants';

  function addChatMessage(msg) {
    state.chatMessages.push(msg);

    // Limit messages
    if (state.chatMessages.length > state.maxChatMessages) {
      state.chatMessages = state.chatMessages.slice(-state.maxChatMessages);
    }

    // Track unread and show toast when chat tab is not active
    if (activeSidebarTab !== 'chat' && msg.userId !== state.userId) {
      chatUnreadCount++;
      updateChatBadge();

      // Show toast notification for incoming chat message
      const preview = msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text;
      D.toast?.info?.(`${msg.name}`, { description: preview, duration: 4000 });
    }

    renderChatMessages();
  }

  function updateChatBadge() {
    // Update unread badge on mobile sidebar toggle and chat tab
    if (chatUnreadCount > 0) {
      if (dom.chatUnreadBadge) {
        dom.chatUnreadBadge.textContent = chatUnreadCount > 99 ? '99+' : String(chatUnreadCount);
        dom.chatUnreadBadge.style.display = 'flex';
        dom.chatUnreadBadge.hidden = false;
      }
      if (dom.sidebarToggleBadge) {
        dom.sidebarToggleBadge.textContent = chatUnreadCount > 99 ? '99+' : String(chatUnreadCount);
        dom.sidebarToggleBadge.style.display = 'flex';
        dom.sidebarToggleBadge.hidden = false;
      }
    } else {
      if (dom.chatUnreadBadge) {
        dom.chatUnreadBadge.style.display = 'none';
        dom.chatUnreadBadge.hidden = true;
      }
      if (dom.sidebarToggleBadge) {
        dom.sidebarToggleBadge.style.display = 'none';
        dom.sidebarToggleBadge.hidden = true;
      }
    }
  }

  function renderChatMessages() {
    if (!dom.chatMessages) return;

    if (state.chatMessages.length === 0) {
      dom.chatMessages.innerHTML = `
        <div class="party-chat-empty">
          <i data-lucide="message-square" class="h-8 w-8"></i>
          <p>Belum ada pesan. Mulai obrolan!</p>
        </div>
      `;
      window.refreshIcons?.();
      return;
    }

    const html = state.chatMessages.map(msg => {
      const isMe = msg.userId === state.userId;
      const time = new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="chat-message ${isMe ? 'chat-message-me' : ''}">
          <div class="chat-message-header">
            <span class="chat-message-name">${escapeHtml(msg.name)}</span>
            <span class="chat-message-time">${time}</span>
          </div>
          <div class="chat-message-body">${escapeHtml(msg.text)}</div>
        </div>
      `;
    }).join('');

    dom.chatMessages.innerHTML = html;

    // Scroll to bottom
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
  }

  function sendChatMessage() {
    const text = dom.chatInput?.value?.trim();
    if (!text || !state.channel) return;

    const msg = {
      id: generateMessageId(),
      userId: state.userId,
      name: state.userName,
      text,
      timestamp: Date.now(),
    };

    // Broadcast to others
    state.channel.send({
      type: 'broadcast',
      event: 'chat:message',
      payload: msg,
    });

    // Add locally
    addChatMessage(msg);
    dom.chatInput.value = '';
  }

  // ── Realtime Channel ─────────────────────────────────────────────────

  function setupRealtimeChannel() {
    if (!state.supabase) {
      console.warn('[Party] Supabase not available, using polling fallback');
      setupPollingFallback();
      return;
    }

    const channelName = `watch-room:${roomId}`;

    state.channel = state.supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: state.userId },
      },
    });

    // Playback events - anyone can broadcast, ignore own events (self:false already handles this)
    ['play', 'pause', 'seek', 'speed', 'episode'].forEach(action => {
      state.channel.on('broadcast', { event: `playback:${action}` }, ({ payload }) => {
        if (payload.updatedBy === state.userId) return;
        queueSyncEvent(action, payload);
      });
    });

    // Periodic drift check ping handler — respond with our current position
    state.channel.on('broadcast', { event: 'playback:ping' }, ({ payload }) => {
      if (payload.from === state.userId) return;
      if (!dom.video) return;

      // Calculate drift relative to the ping sender
      const eventTime = payload.updatedAt || getServerNow();
      const elapsed = (getServerNow() - eventTime) / 1000;
      const remoteTime = (payload.currentTime || 0) + (elapsed * (state.playbackRate || 1));
      const localTime = dom.video.currentTime || 0;
      const drift = Math.abs(localTime - remoteTime);

      // Only correct if drift is significant and we're both playing the same episode
      if (drift > 2.5 && payload.isPlaying && !dom.video.paused &&
          payload.episode === (state.room?.current_episode || 1)) {
        applyDriftCorrection(remoteTime, drift);
        updateSyncStatus('syncing');
      }
    });

    // Sync request/response (for late joiners) - any device can respond
    state.channel.on('broadcast', { event: 'playback:sync-request' }, ({ payload }) => {
      if (dom.video && !dom.video.paused) {
        state.channel.send({
          type: 'broadcast',
          event: 'playback:sync-response',
          payload: {
            currentTime: dom.video.currentTime,
            isPlaying: !dom.video.paused,
            episode: state.room.current_episode,
            updatedAt: Date.now(),
            targetUserId: payload.by,
          },
        });
      }
    });

    state.channel.on('broadcast', { event: 'playback:sync-response' }, ({ payload }) => {
      if (payload.targetUserId === state.userId) {
        queueSyncEvent(payload.isPlaying ? 'play' : 'pause', payload);
      }
    });

    // Chat messages
    state.channel.on('broadcast', { event: 'chat:message' }, ({ payload }) => {
      addChatMessage(payload);
    });

    // Room events
    state.channel.on('broadcast', { event: 'room:settings' }, ({ payload }) => {
      if (state.room) {
        state.room.settings = { ...state.room.settings, ...payload.settings };
      }
    });

    state.channel.on('broadcast', { event: 'room:closed' }, () => {
      D.toast?.info?.('Room Ditutup', { description: 'Host telah menutup room ini.' });
      setTimeout(() => { window.location.href = '/party'; }, 2000);
    });

    let isInitialSync = true;
    setTimeout(() => { isInitialSync = false; }, 3000);

    // Presence events - join notification (host only, genuine new joins only)
    state.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('[Party] Presence join:', key, newPresences);
      fetchRoomState();

      // Track presence key to avoid showing notifications for initial sync
      if (isInitialSync) {
        state.seenPresenceKeys.add(key);
        return;
      }

      // If already seen, don't show notification again (e.g. they refreshed)
      if (state.seenPresenceKeys.has(key)) {
        return;
      }
      
      state.seenPresenceKeys.add(key);

      // Only host sees join notifications for others
      if (state.isHost && newPresences && newPresences.length > 0) {
        const pres = newPresences[0];
        if (pres.userId !== state.userId) {
          showJoinNotification(pres);
        }
      }
    });

    state.channel.on('presence', { event: 'leave' }, ({ key }) => {
      console.log('[Party] Presence leave:', key);
      fetchRoomState();
    });

    // Subscribe
    state.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        state.isConnected = true;
        state.reconnectAttempts = 0;
        state.emaSamples = 0; // Reset EMA for fresh offset calculation
        updateSyncStatus('connected');

        // Track presence
        await state.channel.track({
          userId: state.userId,
          displayName: state.userName,
          avatarUrl: state.userAvatar,
          role: state.isHost ? 'host' : 'viewer',
          status: 'active',
        });

        // Request sync if not host
        if (!state.isHost) {
          state.channel.send({
            type: 'broadcast',
            event: 'playback:sync-request',
            payload: { by: state.userId },
          });
        }

        // Start heartbeat and periodic drift check
        startHeartbeat();
        startPeriodicDriftCheck();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        state.isConnected = false;
        updateSyncStatus('disconnected');
        handleReconnect();
      } else if (status === 'CLOSED') {
        state.isConnected = false;
        updateSyncStatus('disconnected');
      }
    });
  }

  function handleReconnect() {
    if (state.reconnectAttempts >= state.maxReconnectAttempts) {
      D.toast?.error?.('Koneksi Terputus', { description: 'Tidak dapat terhubung kembali ke room.' });
      return;
    }

    state.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000);

    console.log(`[Party] Reconnecting in ${delay}ms (attempt ${state.reconnectAttempts})`);

    setTimeout(() => {
      if (state.channel) {
        state.supabase?.removeChannel(state.channel);
      }
      setupRealtimeChannel();
    }, delay);
  }

  function setupPollingFallback() {
    // Fallback: poll room state every 3 seconds
    setInterval(fetchRoomState, 3000);
    updateSyncStatus('connected');
  }

  // ── Heartbeat ────────────────────────────────────────────────────────

  function startHeartbeat() {
    if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);

    state.heartbeatTimer = setInterval(async () => {
      if (!state.isConnected || !state.channel) return;

      try {
        // Use sendBeacon for lightweight heartbeat (no response needed, lower overhead)
        const url = `/api/party/rooms/${roomId}/sync`;
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url);
        } else {
          await fetch(url, { headers: { accept: 'application/json' }, keepalive: true });
        }
      } catch (err) {
        console.warn('[Party] Heartbeat failed:', err);
      }
    }, 8000); // Every 8 seconds
  }

  // ── Join Notification with Sound ──────────────────────────────────────

  // Simple beep sound using Web Audio API
  let audioCtx = null;
  function playJoinSound() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);        // A5
      osc.frequency.setValueAtTime(1108, audioCtx.currentTime + 0.1); // C#6
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) { /* ignore audio errors */ }
  }

  function showJoinNotification(presence) {
    const name = presence.displayName || 'Pengguna';

    // Use plain text toast (Sonner doesn't render HTML in descriptions)
    D.toast?.success?.(`${name} Bergabung`, { description: 'Bergabung ke room', duration: 4000 });
    playJoinSound();
  }

  // ── Countdown Timer & Room Expiry ─────────────────────────────────────

  let countdownTimer = null;

  function startCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);

    countdownTimer = setInterval(() => {
      if (!state.room || !state.room.expires_at) return;

      const now = Date.now();
      const expiresAt = new Date(state.room.expires_at).getTime();
      const remaining = Math.max(0, expiresAt - now);

      if (remaining <= 0) {
        clearInterval(countdownTimer);
        showExpiredPopup();
        return;
      }

      // Show countdown
      if (dom.countdown) {
        dom.countdown.style.display = '';
        const hours = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);

        if (dom.countdownText) {
          if (hours > 0) {
            dom.countdownText.textContent = `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          } else {
            dom.countdownText.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
          }
        }

        // Warning states
        dom.countdown.classList.toggle('is-warning', remaining <= 300000 && remaining > 60000); // < 5 min
        dom.countdown.classList.toggle('is-danger', remaining <= 60000); // < 1 min
      }
    }, 1000);
  }

  function showExpiredPopup() {
    // Stop video
    if (dom.video) {
      dom.video.pause();
      dom.video.src = '';
    }

    // Show overlay
    if (dom.expiredOverlay) {
      dom.expiredOverlay.style.display = 'grid';
    }

    // Countdown redirect
    let redirectSeconds = 5;
    if (dom.expiredCountdown) {
      dom.expiredCountdown.innerHTML = `Mengalihkan dalam <strong>${redirectSeconds}</strong> detik...`;
    }

    const redirectTimer = setInterval(() => {
      redirectSeconds--;
      if (dom.expiredCountdown) {
        dom.expiredCountdown.innerHTML = `Mengalihkan dalam <strong>${redirectSeconds}</strong> detik...`;
      }
      if (redirectSeconds <= 0) {
        clearInterval(redirectTimer);
        // Cleanup
        if (state.channel) state.supabase?.removeChannel(state.channel);
        if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);
        if (state.driftCheckTimer) clearInterval(state.driftCheckTimer);
        if (state.hls) state.hls.destroy();
        if (countdownTimer) clearInterval(countdownTimer);
        window.location.href = '/party';
      }
    }, 1000);
  }

  // ── Host Actions ─────────────────────────────────────────────────────

  async function kickParticipant(targetUserId) {
    // Use custom confirm modal instead of browser confirm()
    const confirmed = await showConfirmModal(
      'Keluarkan Peserta',
      'Yakin ingin mengeluarkan peserta ini dari room?',
      'Keluarkan',
      'party-btn-danger'
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/party/rooms/${roomId}/kick`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ target_user_id: targetUserId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mengeluarkan peserta');
      }

      D.toast?.success?.('Peserta Dikeluarkan');
      fetchRoomState();
    } catch (err) {
      D.toast?.error?.('Gagal', { description: err.message });
    }
  }

  async function leaveRoom() {
    // Show loading state on confirm button
    if (dom.btnConfirmLeave) {
      dom.btnConfirmLeave.disabled = true;
      dom.btnConfirmLeave.innerHTML = '<span class="party-btn-spinner"></span> Keluar...';
      window.refreshIcons?.();
    }

    try {
      await fetch(`/api/party/rooms/${roomId}/leave`, { method: 'POST' });

      // Cleanup
      if (state.channel) state.supabase?.removeChannel(state.channel);
      if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);
      if (state.driftCheckTimer) clearInterval(state.driftCheckTimer);
      if (state.hls) state.hls.destroy();

      window.location.href = '/party';
    } catch (err) {
      console.error('[Party] Leave error:', err);
      window.location.href = '/party';
    }
  }

  // ── Invite System ────────────────────────────────────────────────────
  // The invite link uses the room code directly (static, no expiry).

  function populateInviteModal() {
    if (!state.room) return;
    const code = state.room.code;
    if (dom.inviteRoomCode) dom.inviteRoomCode.textContent = code;
    if (dom.inviteLinkInput) {
      dom.inviteLinkInput.value = `${window.location.origin}/party/join/${code}`;
    }
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      D.toast?.success?.('Disalin ke Clipboard');
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      D.toast?.success?.('Disalin ke Clipboard');
    }
  }

  // ── Video Event Handlers ─────────────────────────────────────────────

  function setupVideoEvents() {
    const video = dom.video;
    if (!video) return;

    // Play/Pause (everyone broadcasts, skip if applying sync)
    video.addEventListener('play', () => {
      updatePlayerControls();
      if (!state.isApplyingSync) {
        broadcastPlayback('play', { currentTime: video.currentTime });
      }
    });

    video.addEventListener('pause', () => {
      updatePlayerControls();
      if (!state.isApplyingSync) {
        broadcastPlayback('pause', { currentTime: video.currentTime });
      }
    });

    // Seek (skip broadcast if applying sync)
    video.addEventListener('seeked', () => {
      updatePlayerControls();
      if (!state.isApplyingSync) {
        broadcastPlayback('seek', { currentTime: video.currentTime });
      } else {
        // Release guard shortly after the seek is finished
        clearTimeout(state.syncGuardTimer);
        state.syncGuardTimer = setTimeout(() => { state.isApplyingSync = false; }, 200);
      }
    });

    // Time update
    video.addEventListener('timeupdate', () => {
      updatePlayerControls();
    });

    // Loaded metadata
    video.addEventListener('loadedmetadata', () => {
      hideOverlay();
      hideBuffering();
      updatePlayerControls();
      state._videoRetryOnce = false;
      state.feedbackTimer = null; // Reset retry flag on successful load

      // Apply pending sync
      if (state.playbackState.currentTime > 0) {
        video.currentTime = state.playbackState.currentTime;
      }
      if (state.playbackState.status === 'playing') {
        video.play().catch(() => {});
      }
    });

    video.addEventListener('loadeddata', () => {
      hideOverlay();
      hideBuffering();
      updatePlayerControls();
    });

    video.addEventListener('error', () => {
      const err = video.error;
      const msg = err ? `Code ${err.code}: ${err.message || 'Unknown'}` : 'Unknown error';
      console.error('[Party] Video error:', msg, 'src:', video.src?.substring(0, 100));
      // Auto-retry up to 3 times with increasing delay
      const retryCount = state._videoRetryCount || 0;
      if (retryCount < 3 && state.room) {
        state._videoRetryCount = retryCount + 1;
        const delay = 2000 * (retryCount + 1);
        console.log(`[Party] Auto-retrying video load (attempt ${retryCount + 1}/3) in ${delay}ms...`);
        showOverlay('Memuat ulang video...');
        setTimeout(() => {
          state._isLoadingStream = false; // Reset guard before retry
          if (state.room) loadStream(state.room.current_episode);
        }, delay);
      } else {
        showOverlay('Gagal memuat video');
        state._streamLoadFailed = true;
      }
    });

    // We do NOT show buffering spinner on waiting/stalled to emulate Google Meet's seamless freeze/resume
    video.addEventListener('playing', () => {
      if (state.isConnected && state.syncState !== 'syncing') {
        updateSyncStatus('connected');
      }
    });
  }

  // ── Control Event Handlers ───────────────────────────────────────────

  function setupControlEvents() {
    // Play/Pause
    const togglePlay = () => {
      if (!dom.video) return;

      // If video has no source (load failed or never loaded), retry loading
      if (dom.video.readyState === 0) {
        if (state.room) {
          showOverlay('Memuat video...');
          loadStream(state.room.current_episode).then(() => {
            // Auto-play after successful load
            if (dom.video && dom.video.readyState > 0 && dom.video.paused) {
              dom.video.play().catch(() => {});
            }
          });
        }
        return;
      }

      if (dom.video.paused) {
        dom.video.play().catch(() => {});
      } else {
        dom.video.pause();
      }
      updatePlayerControls(); // update instantly to remove visual delay
    };

    dom.playPauseBtn?.addEventListener('click', togglePlay);
    dom.centerPlayBtn?.addEventListener('click', togglePlay);

    function showSeekFeedback(delta, text) {
      if (!dom.seekFeedback) return;
      clearTimeout(state.feedbackTimer);
      dom.seekFeedback.textContent = text || `${delta > 0 ? '+' : ''}${delta}s`;
      
      // YouTube-like side positioning
      dom.seekFeedback.classList.remove('is-left', 'is-right');
      if (delta < 0) dom.seekFeedback.classList.add('is-left');
      else if (delta > 0) dom.seekFeedback.classList.add('is-right');

      dom.seekFeedback.classList.remove('is-visible');
      // Force reflow
      void dom.seekFeedback.offsetWidth;
      dom.seekFeedback.classList.add('is-visible');

      state.feedbackTimer = setTimeout(() => {
        if (dom.seekFeedback) dom.seekFeedback.classList.remove('is-visible');
      }, 800);
    }

    function seekBy(delta) {
      if (!dom.video || dom.video.readyState === 0) return;
      const duration = dom.video.duration || 0;
      const newTime = Math.min(Math.max(0, dom.video.currentTime + delta), duration || Infinity);
      dom.video.currentTime = newTime;
      showSeekFeedback(delta);
      broadcastPlayback('seek', { currentTime: newTime });
      updatePlayerControls(); // update instantly to remove visual delay
    }

    // Rewind/Forward (everyone broadcasts)
    dom.rewindBtn?.addEventListener('click', () => seekBy(-10));
    dom.forwardBtn?.addEventListener('click', () => seekBy(10));

    // Sidebar tabs logic — handled by switchSidebarTab in setupUIEvents

    dom.speedBtn?.addEventListener('click', () => {
      if (dom.speedMenu) dom.speedMenu.hidden = !dom.speedMenu.hidden;
    });

    dom.speedMenu?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-rate]');
      if (!btn) return;
      state.playbackRate = Number(btn.dataset.rate) || 1;
      if (dom.video) dom.video.playbackRate = state.playbackRate;
      if (dom.speedMenu) dom.speedMenu.hidden = true;
      broadcastPlayback('speed', { rate: state.playbackRate });
      updatePlayerControls();
    });

    // Close menus on outside click
    document.addEventListener('click', (e) => {
      if (dom.speedMenu && !e.target.closest('#partySpeedMenu') && !e.target.closest('#partySpeedBtn')) {
        dom.speedMenu.hidden = true;
      }
    });

    // Mute/Volume
    dom.muteBtn?.addEventListener('click', () => {
      if (!dom.video) return;
      dom.video.muted = !dom.video.muted;
      updatePlayerControls();
    });

    dom.volumeBar?.addEventListener('input', () => {
      if (!dom.video) return;
      dom.video.volume = Number(dom.volumeBar.value);
      dom.video.muted = dom.video.volume === 0;
      updatePlayerControls();
    });

    // Seek bar
    dom.seekBar?.addEventListener('input', () => {
      state.seeking = true;
      const duration = dom.video?.duration || 0;
      const pct = Number(dom.seekBar.value || 0) / 1000;
      dom.seekBar.style.setProperty('--progress', `${pct * 100}%`);
      if (dom.currentTime) dom.currentTime.textContent = formatTime(duration * pct);
    });

    dom.seekBar?.addEventListener('change', () => {
      const duration = dom.video?.duration || 0;
      const newTime = duration * (Number(dom.seekBar.value || 0) / 1000);
      if (dom.video) dom.video.currentTime = newTime;
      broadcastPlayback('seek', { currentTime: newTime });
      state.seeking = false;
      updatePlayerControls();
    });

    // Fullscreen
    dom.fullscreenBtn?.addEventListener('click', async () => {
      const target = dom.playerInner;
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (target?.requestFullscreen) {
        await target.requestFullscreen();
      }
    });

    // (Host controls removed, all users can change episodes via tab)
  }

  // ── UI Event Handlers ────────────────────────────────────────────────

  function setupUIEvents() {
    // ── Mobile Sidebar Toggle & Tabs ─────────────────────────────────────

    function isMobile() {
      return window.innerWidth < 1024;
    }

    function openSidebar() {
      if (dom.sidebar) dom.sidebar.classList.add('is-open');
      if (dom.btnToggleSidebar) dom.btnToggleSidebar.classList.add('is-hidden');
    }

    function closeSidebar() {
      if (dom.sidebar) dom.sidebar.classList.remove('is-open');
      if (dom.btnToggleSidebar) dom.btnToggleSidebar.classList.remove('is-hidden');
    }

    // Desktop sidebar toggle (collapse/expand)
    function toggleSidebarDesktop() {
      if (!dom.roomGrid) return;
      const isCollapsed = dom.roomGrid.classList.toggle('is-sidebar-collapsed');
      if (dom.btnToggleSidebarDesktop) {
        setIcon(dom.btnToggleSidebarDesktop, isCollapsed ? 'panel-right-open' : 'panel-right', 'h-5 w-5');
        dom.btnToggleSidebarDesktop.setAttribute('aria-label', isCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar');
      }
    }

    dom.btnToggleSidebarDesktop?.addEventListener('click', toggleSidebarDesktop);
    dom.btnReopenSidebar?.addEventListener('click', () => {
      if (dom.roomGrid) {
        dom.roomGrid.classList.remove('is-sidebar-collapsed');
        if (dom.btnToggleSidebarDesktop) {
          setIcon(dom.btnToggleSidebarDesktop, 'panel-right', 'h-5 w-5');
          dom.btnToggleSidebarDesktop.setAttribute('aria-label', 'Sembunyikan sidebar');
        }
      }
    });

    function switchSidebarTab(tabName) {
      activeSidebarTab = tabName;

      // Update tab buttons
      dom.sidebarTabs?.querySelectorAll('.sidebar-tab[data-tab]').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.tab === tabName);
      });

      // Show/hide panels using CSS class (not inline display)
      const allPanels = document.querySelectorAll('.party-panel[data-tab-content]');
      allPanels.forEach(panel => {
        const isActive = panel.dataset.tabContent === tabName;
        panel.classList.toggle('is-active', isActive);
        // Also clear any inline display that was set before
        panel.style.display = '';
      });

      // Clear unread when switching to chat
      if (tabName === 'chat') {
        chatUnreadCount = 0;
        updateChatBadge();
        setTimeout(() => dom.chatInput?.focus(), 100);
      }
    }

    // Toggle sidebar button (mobile)
    dom.btnToggleSidebar?.addEventListener('click', openSidebar);
    dom.btnCloseSidebar?.addEventListener('click', closeSidebar);

    // Tab switching
    dom.sidebarTabs?.addEventListener('click', (e) => {
      const tab = e.target.closest('.sidebar-tab[data-tab]');
      if (tab) switchSidebarTab(tab.dataset.tab);
    });

    // Auto-close sidebar on mobile when resizing to desktop
    window.addEventListener('resize', () => {
      if (!isMobile()) {
        if (dom.sidebar) dom.sidebar.classList.remove('is-open');
        if (dom.btnToggleSidebar) dom.btnToggleSidebar.classList.remove('is-hidden');
      }
    });

    // Initial state: show participants tab, hide chat
    switchSidebarTab('participants');

    // ── Chat ─────────────────────────────────────────────────────────────

    dom.btnSendChat?.addEventListener('click', sendChatMessage);
    dom.chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });

    // Invite modal
    dom.btnInvite?.addEventListener('click', () => {
      if (dom.inviteModal) {
        dom.inviteModal.style.display = '';
        requestAnimationFrame(() => dom.inviteModal.classList.add('is-visible'));
        populateInviteModal();
      }
    });

    dom.btnCloseInvite?.addEventListener('click', () => {
      if (dom.inviteModal) {
        dom.inviteModal.classList.remove('is-visible');
        setTimeout(() => { dom.inviteModal.style.display = 'none'; }, 200);
      }
    });

    dom.btnCopyCode?.addEventListener('click', () => {
      copyToClipboard(dom.inviteRoomCode?.textContent || '');
    });

    dom.btnCopyLink?.addEventListener('click', () => {
      copyToClipboard(dom.inviteLinkInput?.value || '');
    });

    // Leave modal
    dom.btnLeaveRoom?.addEventListener('click', () => {
      if (dom.leaveModal) {
        dom.leaveModal.style.display = '';
        requestAnimationFrame(() => dom.leaveModal.classList.add('is-visible'));
      }
    });

    dom.btnCancelLeave?.addEventListener('click', () => {
      if (dom.leaveModal) {
        dom.leaveModal.classList.remove('is-visible');
        setTimeout(() => { dom.leaveModal.style.display = 'none'; }, 200);
      }
    });

    dom.btnConfirmLeave?.addEventListener('click', leaveRoom);

    // Close modals on backdrop click
    [dom.inviteModal, dom.leaveModal].forEach(modal => {
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('is-visible');
          setTimeout(() => { modal.style.display = 'none'; }, 200);
        }
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space' || e.key === 'k') {
        e.preventDefault();
        dom.playPauseBtn?.click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        dom.rewindBtn?.click();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        dom.forwardBtn?.click();
      } else if (e.key === 'f') {
        e.preventDefault();
        dom.fullscreenBtn?.click();
      }
    });

    // Cleanup on page leave
    window.addEventListener('beforeunload', () => {
      if (state.channel) state.supabase?.removeChannel(state.channel);
      if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);
      if (state.driftCheckTimer) clearInterval(state.driftCheckTimer);
      if (countdownTimer) clearInterval(countdownTimer);
      if (state.hls) state.hls.destroy();
      clearTimeout(state.syncGuardTimer);
      clearTimeout(state.syncDebounceTimer);
      clearTimeout(state.bufferingTimer);
      clearTimeout(state.pendingSeekBroadcast);
      clearTimeout(state._driftCorrectionTimer);
      clearTimeout(state._syncRevertTimer);
    });
  }

  // ── Auto-hide Controls (like watch page) ─────────────────────────────

  const IDLE_HIDE_MS = 2600;
  let controlsHideTimer = null;

  function setControlsVisible(visible) {
    if (!dom.playerInner) return;
    dom.playerInner.classList.toggle('controls-visible', visible);
    dom.playerInner.classList.toggle('controls-hidden', !visible);
  }

  function scheduleControlsHide() {
    clearTimeout(controlsHideTimer);
    const video = dom.video;
    // Only auto-hide when playing
    if (!video || video.paused || video.ended) return;
    controlsHideTimer = setTimeout(() => setControlsVisible(false), IDLE_HIDE_MS);
  }

  function showControlsAndScheduleHide() {
    setControlsVisible(true);
    scheduleControlsHide();
  }

  function holdControlsVisible() {
    clearTimeout(controlsHideTimer);
    setControlsVisible(true);
  }

  let tapTimer = null;
  let lastTap = { time: 0, side: '', x: 0, y: 0 };
  const TAP_DELAY_MS = 230;
  const DOUBLE_TAP_MS = 320;

  function isMobileViewport() {
    return window.matchMedia?.('(max-width: 767.98px), (pointer: coarse)').matches;
  }
  function isTouchLikePointer(e) {
    return e?.pointerType === 'touch' || e?.pointerType === 'pen';
  }

  function setupAutoHideControls() {
    const inner = dom.playerInner;
    const video = dom.video;
    if (!inner || !video) return;

    // Start visible, hide after idle when playing
    setControlsVisible(true);

    // Pointer events on player inner (tap to toggle)
    let gesture = null;

    inner.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      // If clicking on interactive elements, just hold visible
      const isInteractive = e.target.closest('button, input, .party-controls, .party-speed-menu');
      if (isInteractive) {
        holdControlsVisible();
        return;
      }
      gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, time: Date.now(), moved: false };
    }, { passive: true });

    inner.addEventListener('pointermove', (e) => {
      // Mouse move always shows controls
      if (e.pointerType === 'mouse') {
        showControlsAndScheduleHide();
        return;
      }
      if (gesture && gesture.id === e.pointerId) {
        if (Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > 12) {
          gesture.moved = true;
        }
      }
    }, { passive: true });

    inner.addEventListener('pointerup', (e) => {
      if (!gesture || gesture.id !== e.pointerId) return;
      const g = gesture;
      gesture = null;

      // If clicking on controls, ignore (handled by holdControlsVisible)
      if (e.target.closest('button, input, .party-controls, .party-speed-menu')) return;

      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      const elapsed = Date.now() - g.time;

      if (g.moved || elapsed > 520 || adx > 18 || ady > 18) return;

      const rect = inner.getBoundingClientRect();
      const side = e.clientX < rect.left + rect.width / 2 ? 'left' : 'right';
      const now = Date.now();
      const mobileGesture = isMobileViewport() || (document.fullscreenElement && isTouchLikePointer(e));
      const isDoubleTap = mobileGesture
        && lastTap.side === side
        && now - lastTap.time <= DOUBLE_TAP_MS
        && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 80;

      if (isDoubleTap) {
        clearTimeout(tapTimer);
        tapTimer = null;
        lastTap = { time: 0, side: '', x: 0, y: 0 };
        if (side === 'left') {
          dom.rewindBtn?.click();
        } else {
          dom.forwardBtn?.click();
        }
        showControlsAndScheduleHide();
        return;
      }

      lastTap = { time: now, side, x: e.clientX, y: e.clientY };
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => {
        tapTimer = null;
        const isHidden = inner.classList.contains('controls-hidden');
        if (isHidden) {
          showControlsAndScheduleHide();
        } else {
          setControlsVisible(false);
          clearTimeout(controlsHideTimer);
        }
      }, mobileGesture ? TAP_DELAY_MS : 0);
    }, { passive: true });

    inner.addEventListener('pointercancel', () => { gesture = null; }, { passive: true });

    // Video state changes affect controls visibility
    video.addEventListener('play', () => {
      inner.classList.add('is-playing');
      inner.classList.remove('is-paused');
      scheduleControlsHide();
    });

    video.addEventListener('pause', () => {
      inner.classList.remove('is-playing');
      inner.classList.add('is-paused');
      clearTimeout(controlsHideTimer);
      setControlsVisible(true);
    });

    video.addEventListener('ended', () => {
      inner.classList.remove('is-playing');
      inner.classList.add('is-paused');
      clearTimeout(controlsHideTimer);
      setControlsVisible(true);
    });

    // Hold controls visible while interacting with controls area
    dom.controls?.addEventListener('pointerenter', holdControlsVisible);
    dom.controls?.addEventListener('pointerleave', scheduleControlsHide);

    // Hold controls visible while loading/buffering
    video.addEventListener('waiting', holdControlsVisible);
    video.addEventListener('seeking', holdControlsVisible);
    video.addEventListener('playing', () => {
      showControlsAndScheduleHide();
    });
  }

  function renderEpisodeMenu() {
    if (!dom.epBtn || !dom.epList) return;
    if (state.room?.content_type !== 'series' || !state.episodes || !state.episodes.length) {
      dom.epBtn.style.display = 'none';
      return;
    }
    dom.epBtn.style.display = '';
    if (dom.epText) dom.epText.textContent = `Episode ${state.room.current_episode} / ${state.episodes.length}`;
    
    dom.epList.innerHTML = '';
    
    // Determine ongoing status from drama data
    const drama = state.drama || {};
    const isOngoing = !!drama.isOngoing;
    const currentOngoingEp = Number(drama.currentEpisode || 0);

    state.episodes.forEach(epItem => {
      const epNum = parseInt(epItem.episode || epItem.ep || epItem, 10);
      if (!epNum) return;
      
      const btn = document.createElement('button');
      btn.className = 'party-ep-btn';
      btn.textContent = epNum;
      
      const isNew = isOngoing && currentOngoingEp > 0 && epNum === currentOngoingEp;
      const isDisabled = isOngoing && currentOngoingEp > 0 && epNum > currentOngoingEp;
      const isCurrentEp = epNum == state.room.current_episode;

      if (isCurrentEp) btn.classList.add('active');
      if (isNew) btn.classList.add('ongoing');
      if (isDisabled) {
        btn.classList.add('disabled');
        btn.dataset.disabled = 'true';
        btn.setAttribute('aria-disabled', 'true');
      }

      // Add animated NEW badge for latest ongoing episode
      if (isNew) {
        const badge = document.createElement('span');
        badge.className = 'party-ep-new-badge';
        badge.innerHTML = '<span class="ping"></span><span class="dot"></span>';
        btn.appendChild(badge);
      }

      btn.addEventListener('click', () => {
        if (isDisabled) {
          D.toast?.warning?.('Episode Belum Rilis', { description: 'Episode ini belum tersedia untuk ditonton.' });
          return;
        }
        changeEpisode(epNum);
      });
      dom.epList.appendChild(btn);
    });
  }

  function changeEpisode(newEp) {
    if (!state.room || state.room.current_episode == newEp) return;
    
    // Check if episode is valid (not disabled/ongoing)
    const drama = state.drama || {};
    const isOngoing = !!drama.isOngoing;
    const currentOngoingEp = Number(drama.currentEpisode || 0);
    if (isOngoing && currentOngoingEp > 0 && newEp > currentOngoingEp) {
      D.toast?.warning?.('Episode Belum Rilis', { description: 'Episode ini belum tersedia untuk ditonton.' });
      return;
    }
    
    state.room.current_episode = newEp;
    state.playbackState.episode = newEp;
    broadcastPlayback('episode', { episode: newEp, currentTime: 0, status: 'paused' });
    loadStream(newEp);
    if (dom.episodeText) {
      dom.episodeText.textContent = state.episodes.length
        ? `Episode ${newEp} / ${state.episodes.length}`
        : `Episode ${newEp}`;
    }
    
    // Update header episode badge
    const headerEp = document.getElementById('partyHeaderEpisode');
    if (headerEp) {
      headerEp.style.display = '';
      const headerEpSpan = headerEp.querySelector('span');
      if (headerEpSpan) headerEpSpan.textContent = `Ep ${newEp}`;
    }
    
    // Update active state on buttons without full re-render
    dom.epList?.querySelectorAll('.party-ep-btn').forEach(btn => {
      const epNum = parseInt(btn.textContent, 10);
      btn.classList.toggle('active', epNum === newEp);
    });
  }

  // ── Initialize ───────────────────────────────────────────────────────

  async function init() {
    showOverlay('Mempersiapkan room...');

    // Init Supabase client
    const hasUser = await initSupabase();
    if (!hasUser) {
      showOverlay('Mohon login terlebih dahulu');
      setTimeout(() => { window.location.href = '/login'; }, 2000);
      return;
    }

    // Join room via API
    const joined = await joinRoomApi();
    if (!joined) {
      // joinRoomApi already shows toast with error message
      showOverlay('Gagal bergabung ke room. Mengalihkan...');
      setTimeout(() => { window.location.href = '/party'; }, 2500);
      return;
    }

    // Fetch full room state (checks expiry)
    const stateOk = await fetchRoomState();
    if (!stateOk) {
      // fetchRoomState already shows message and redirects
      return;
    }

    // Start countdown timer (shows remaining time in header)
    startCountdown();

    // Activate sidebar tabs immediately so user sees content right away
    // (before the slow video load)
    const allPanels = document.querySelectorAll('.party-panel[data-tab-content]');
    allPanels.forEach(panel => {
      const isParticipants = panel.dataset.tabContent === 'participants';
      panel.classList.toggle('is-active', isParticipants);
      panel.style.display = '';
    });
    window.refreshIcons?.();

    // Setup event listeners BEFORE loading video so events are captured
    setupVideoEvents();
    setupControlEvents();
    setupUIEvents();
    setupAutoHideControls();

    // Load episodes and video stream in parallel for faster startup
    const episodePromise = (state.room?.content_type === 'series') ? (async () => {
      try {
        const platformConfig = D.Platforms?.[state.room.platform];
        if (platformConfig && platformConfig.detail) {
          const res = await platformConfig.detail(state.room.content_id);
          const data = D.unwrap(res) || {};
          const drama = data.data || data;
          state.drama = drama;
          state.episodes = drama.episodes || data.episodes || [];
          renderEpisodeMenu();

          // Initialize header episode badge for series
          const headerEp = document.getElementById('partyHeaderEpisode');
          if (headerEp) {
            headerEp.style.display = '';
            const headerEpSpan = headerEp.querySelector('span');
            if (headerEpSpan) headerEpSpan.textContent = `Ep ${state.room.current_episode}`;
          }
        }
      } catch (err) {
        console.error('[Party] Failed to load episodes:', err);
      }
    })() : Promise.resolve();

    // Load video stream (non-blocking alongside episodes)
    const streamPromise = loadStream(state.room.current_episode);

    // Setup realtime channel in parallel
    setupRealtimeChannel();

    // Wait for both to complete
    await Promise.all([episodePromise, streamPromise]);

    // Initial sync — only hide overlay if video loaded successfully
    if (!state._streamLoadFailed) {
      hideOverlay();
    }
    updateSyncStatus('connected');

    window.refreshIcons?.();
  }

  init();
})();
