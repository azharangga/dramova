/* =====================================================================
   Party Landing Page – Wizard-based create room, join, list rooms.
   ===================================================================== */
(function () {
  const D = window.DramSi;

  // ── DOM refs ──────────────────────────────────────────────────────
  const dom = {
    btnCreateRoom: document.getElementById('btnCreateRoom'),
    btnJoinRoom: document.getElementById('btnJoinRoom'),
    inputRoomCode: document.getElementById('inputRoomCode'),
    otpWrap: document.getElementById('otpInputWrap'),
    roomsLoading: document.getElementById('partyRoomsLoading'),
    roomsEmpty: document.getElementById('partyRoomsEmpty'),
    roomsList: document.getElementById('partyRoomsList'),
    btnRefreshRooms: document.getElementById('btnRefreshRooms'),
    // Wizard
    modal: document.getElementById('createRoomModal'),
    btnClose: document.getElementById('btnCloseCreateModal'),
    btnBack: document.getElementById('btnWizardBack'),
    btnBackBottom: document.getElementById('btnWizardBackBottom'),
    btnNext: document.getElementById('btnWizardNext'),
    btnSubmit: document.getElementById('btnSubmitCreate'),
    wizardTitle: document.getElementById('wizardTitle'),
    // Step 2
    platformGrid: document.getElementById('wizardPlatformGrid'),
    // Step 3
    searchInput: document.getElementById('wizardSearchInput'),
    searchClear: document.getElementById('wizardSearchClear'),
    contentGrid: document.getElementById('wizardContentGrid'),
    contentStatus: document.getElementById('wizardContentStatus'),
    // Step 4
    selectedContent: document.getElementById('wizardSelectedContent'),
    episodeGrid: document.getElementById('wizardEpisodeGrid'),
    // Step 5
    summaryCard: document.getElementById('wizardSummaryCard'),
    roomTitle: document.getElementById('wizardRoomTitle'),
    durationGrid: document.getElementById('wizardDurationGrid'),
    customDurationWrap: document.getElementById('wizardCustomDurationWrap'),
    customHours: document.getElementById('wizardCustomHours'),
    customMinutes: document.getElementById('wizardCustomMinutes'),
    durationPreview: document.getElementById('wizardDurationPreview'),
    maxParticipants: document.getElementById('wizardMaxParticipants'),
    maxParticipantsHint: document.getElementById('wizardMaxParticipantsHint'),
  };

  // ── Wizard State ──────────────────────────────────────────────────
  const state = {
    step: 1,
    contentType: null,    // 'series' | 'movie'
    platform: null,       // e.g. 'kdrama'
    content: null,        // { id, title, cover }
    drama: null,          // full detail object
    episodes: [],
    selectedEpisode: 1,
    duration: 24,         // -1 for unlimited, 0 for custom (uses customHours + customMinutes)
    customHours: 1,       // custom duration hours part
    customMinutes: 0,     // custom duration minutes part
  };

  const STEP_TITLES = {
    1: 'Pilih Tipe Tontonan',
    2: 'Pilih Platform',
    3: 'Pilih Tontonan',
    4: 'Pilih Episode',
    5: 'Atur Room',
  };

  // ── Helpers ───────────────────────────────────────────────────────
  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  function showLoading(show) {
    if (dom.roomsLoading) dom.roomsLoading.style.display = show ? '' : 'none';
    if (dom.roomsEmpty) dom.roomsEmpty.style.display = 'none';
    if (dom.roomsList) dom.roomsList.style.display = 'none';
  }
  function showEmpty() {
    if (dom.roomsLoading) dom.roomsLoading.style.display = 'none';
    if (dom.roomsEmpty) dom.roomsEmpty.style.display = '';
    if (dom.roomsList) dom.roomsList.style.display = 'none';
  }
  function showRooms() {
    if (dom.roomsLoading) dom.roomsLoading.style.display = 'none';
    if (dom.roomsEmpty) dom.roomsEmpty.style.display = 'none';
    if (dom.roomsList) dom.roomsList.style.display = '';
  }

  function formatTimeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
    if (m < 1) return 'Baru saja';
    if (m < 60) return `${m} menit lalu`;
    if (h < 24) return `${h} jam lalu`;
    return `${d} hari lalu`;
  }

  function getExpiresLabel(expiresAt) {
    if (!expiresAt) return null; // unlimited
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return 'Kedaluwarsa';
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    if (h > 0) return `${h}j ${m}m tersisa`;
    return `${m}m tersisa`;
  }

  /**
   * CSS spinner HTML for buttons (replaces emoji).
   */
  function btnSpinner(text = '') {
    return `<span class="party-btn-spinner"></span>${text ? ' ' + text : ''}`;
  }

  /**
   * Show a custom confirm modal. Returns a Promise<boolean>.
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

  function getContentTypeLabel(type) {
    return { shorts: 'Short Drama', series: 'Serial', movie: 'Film' }[type] || type;
  }
  function getPlatformLabel(platform) {
    return D.Platforms?.[platform]?.label || platform;
  }

  function getItemTitle(item) {
    return (D.cleanTitle?.(item.title || item.bookName) || item.title || item.bookName || 'Tanpa Judul').trim();
  }
  function getItemCover(item) {
    return item.cover || item.coverWap || item.image || '';
  }

  // ── Load & Render Active Rooms ─────────────────────────────────────
  let currentUserId = null;
  
  async function loadRooms() {
    showLoading(true);
    try {
      const res = await fetch('/api/party/rooms', { headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error('Gagal memuat room');
      const data = await res.json();
      currentUserId = data.user_id || null;
      const rooms = data.rooms || [];
      if (rooms.length === 0) { showEmpty(); return; }
      renderRooms(rooms);
      showRooms();
    } catch (err) {
      console.error('[Party] Load rooms error:', err);
      D.toast?.error?.('Gagal Memuat Room', { description: err.message });
      showEmpty();
    }
  }
  
  function renderRooms(rooms) {
    if (!dom.roomsList) return;
    dom.roomsList.innerHTML = rooms.map(room => {
      const isHost = currentUserId && room.host_id === currentUserId;
      const expiresLabel = getExpiresLabel(room.expires_at);
      const isExpired = expiresLabel === 'Kedaluwarsa';
      return `
        <div class="party-room-card-wrap">
          <a href="/party/room/${room.id}" class="party-room-card ${isExpired ? 'is-expired' : ''}">
            <div class="party-room-card-header">
              <div class="party-room-card-title">${escapeHtml(room.title)}</div>
              <span class="party-room-card-code">${room.code}</span>
            </div>
            <div class="party-room-card-info">
              ${isHost ? '<span class="party-room-card-host"><i data-lucide="crown" class="h-3 w-3"></i>Host</span><span class="party-room-card-separator">\u2022</span>' : ''}
              <span class="party-room-card-type"><i data-lucide="film" class="h-3 w-3"></i>${getContentTypeLabel(room.content_type)}</span>
              <span class="party-room-card-separator">\u2022</span>
              <span>${getPlatformLabel(room.platform)}</span>
              ${expiresLabel ? `<span class="party-room-card-separator">\u2022</span><span class="party-room-card-expires ${isExpired ? 'is-expired' : ''}"><i data-lucide="clock" class="h-3 w-3"></i>${expiresLabel}</span>` : ''}
            </div>
            <div class="party-room-card-footer">
              <span class="party-room-card-time"><i data-lucide="clock" class="h-3 w-3"></i>${formatTimeAgo(room.created_at)}</span>
              <span class="party-room-card-ep">Ep ${room.current_episode}</span>
            </div>
          </a>
          ${isHost ? `<button class="party-room-card-delete" data-room-id="${room.id}" data-room-code="${room.code}" aria-label="Hapus room" title="Tutup room">
            <i data-lucide="trash-2" class="h-4 w-4"></i>
          </button>` : ''}
        </div>
      `;
    }).join('');
  
    // Bind delete buttons
    dom.roomsList.querySelectorAll('.party-room-card-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeRoomFromList(btn.dataset.roomId, btn.dataset.roomCode);
      });
    });
  
    window.refreshIcons?.();
  }
  
  async function closeRoomFromList(roomId, roomCode) {
    const confirmed = await showConfirmModal(
      'Tutup Room',
      `Tutup room ${roomCode}? Room akan dihapus dan tidak bisa diakses lagi.`,
      'Tutup',
      'party-btn-danger'
    );
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/party/rooms/${roomId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menutup room');
      D.toast?.success?.('Room Ditutup');
      loadRooms();
    } catch (err) {
      console.error('[Party] Close room error:', err);
      D.toast?.error?.('Gagal Menutup Room', { description: err.message });
    }
  }

  // ── Join Room by Code ──────────────────────────────────────────────
  function getOtpCode() {
    if (!dom.otpWrap) return dom.inputRoomCode?.value?.trim()?.toUpperCase() || '';
    const boxes = dom.otpWrap.querySelectorAll('.party-otp-box');
    let code = '';
    boxes.forEach(b => { code += (b.value || '').toUpperCase(); });
    return code;
  }

  function setOtpCode(code) {
    if (!dom.otpWrap) return;
    const boxes = dom.otpWrap.querySelectorAll('.party-otp-box');
    const chars = code.toUpperCase().split('');
    boxes.forEach((b, i) => { b.value = chars[i] || ''; });
    if (dom.inputRoomCode) dom.inputRoomCode.value = code.toUpperCase();
  }

  function clearOtp() {
    if (!dom.otpWrap) return;
    dom.otpWrap.querySelectorAll('.party-otp-box').forEach(b => { b.value = ''; });
    if (dom.inputRoomCode) dom.inputRoomCode.value = '';
  }

  function focusOtpBox(idx) {
    if (!dom.otpWrap) return;
    const boxes = dom.otpWrap.querySelectorAll('.party-otp-box');
    if (boxes[idx]) boxes[idx].focus();
  }

  async function joinRoomByCode() {
    const code = getOtpCode();
    if (!code || code.length !== 6) {
      D.toast?.warning?.('Kode Tidak Valid', { description: 'Masukkan kode 6 karakter' });
      return;
    }
    dom.btnJoinRoom.disabled = true;
    dom.btnJoinRoom.innerHTML = btnSpinner();
    try {
      const res = await fetch(`/api/party/join-code/${code}`, { headers: { accept: 'application/json' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kode tidak ditemukan');
      D.toast?.success?.('Room Ditemukan!', { description: `Bergabung ke "${data.room.title}"...` });
      window.location.href = `/party/room/${data.room_id}`;
    } catch (err) {
      console.error('[Party] Join error:', err);
      D.toast?.error?.('Gagal Bergabung', { description: err.message });
    } finally {
      dom.btnJoinRoom.disabled = false;
      dom.btnJoinRoom.innerHTML = '<i data-lucide="log-in" class="h-4 w-4"></i><span>Gabung</span>';
      window.refreshIcons?.();
    }
  }

  // ════════════════════════════════════════════════════════════════════
  //  WIZARD
  // ════════════════════════════════════════════════════════════════════

  function openModal() {
    resetWizard();
    if (dom.modal) {
      dom.modal.style.display = '';
      requestAnimationFrame(() => dom.modal.classList.add('is-visible'));
    }
  }

  function closeModal() {
    if (dom.modal) {
      dom.modal.classList.remove('is-visible');
      setTimeout(() => { dom.modal.style.display = 'none'; }, 200);
    }
  }

  function resetWizard() {
    state.step = 1;
    state.contentType = null;
    state.platform = null;
    state.content = null;
    state.drama = null;
    state.episodes = [];
    state.selectedEpisode = 1;
    state.duration = 24;
    state.customHours = 1;
    state.customMinutes = 0;
    if (dom.searchInput) dom.searchInput.value = '';
    if (dom.contentGrid) dom.contentGrid.innerHTML = '';
    if (dom.episodeGrid) dom.episodeGrid.innerHTML = '';
    if (dom.roomTitle) dom.roomTitle.value = '';
    if (dom.maxParticipants) dom.maxParticipants.value = '5';
    if (dom.customHours) dom.customHours.value = '1';
    if (dom.customMinutes) dom.customMinutes.value = '0';
    if (dom.customDurationWrap) dom.customDurationWrap.style.display = 'none';
    if (dom.durationPreview) dom.durationPreview.textContent = 'Total: 1 jam';
    if (dom.maxParticipantsHint) dom.maxParticipantsHint.style.display = 'none';
    if (dom.btnSubmit) dom.btnSubmit.disabled = false;
    // Reset duration chips
    dom.durationGrid?.querySelectorAll('.wizard-duration-chip').forEach(c => {
      c.classList.toggle('is-active', c.dataset.hours === '24');
    });
    updateStepUI();
  }

  // ── Step Navigation ────────────────────────────────────────────────
  function goToStep(step) {
    state.step = step;
    updateStepUI();
  }

  function updateStepUI() {
    const step = state.step;
    // Show/hide step divs
    document.querySelectorAll('.wizard-step').forEach(el => {
      el.style.display = Number(el.dataset.step) === step ? '' : 'none';
    });
    // Update step dots
    document.querySelectorAll('.wizard-step-dot').forEach(el => {
      const s = Number(el.dataset.step);
      el.classList.toggle('is-active', s === step);
      el.classList.toggle('is-done', s < step);
    });
    // Update title
    if (dom.wizardTitle) dom.wizardTitle.textContent = STEP_TITLES[step] || 'Buat Room Nonton Bareng';
    // Back button visibility
    if (dom.btnBack) dom.btnBack.style.display = step > 1 ? '' : 'none';
    if (dom.btnBackBottom) dom.btnBackBottom.style.display = step > 1 ? '' : 'none';
    // Next/Submit button visibility
    if (dom.btnNext) dom.btnNext.style.display = step >= 1 && step < 5 ? '' : 'none';
    if (dom.btnSubmit) dom.btnSubmit.style.display = step === 5 ? '' : 'none';
    // Disable Next on steps that need selection
    if (dom.btnNext) {
      dom.btnNext.disabled = false;
      if (step === 1) dom.btnNext.disabled = !state.contentType;
      if (step === 2) dom.btnNext.disabled = !state.platform;
      if (step === 3) dom.btnNext.disabled = !state.content;
      if (step === 4) dom.btnNext.disabled = !state.selectedEpisode;
    }
    // Disable submit if max participants > 5
    if (step === 5 && dom.btnSubmit) {
      const maxParts = parseInt(dom.maxParticipants?.value || '5', 10);
      dom.btnSubmit.disabled = maxParts > 5;
    }
    // Populate summary on step 5
    if (step === 5) populateSummary();
  }

  function handleNext() {
    const step = state.step;
    if (step === 1 && !state.contentType) {
      D.toast?.warning?.('Pilih Tipe', { description: 'Pilih Serial atau Film terlebih dahulu' });
      return;
    }
    if (step === 2 && !state.platform) {
      D.toast?.warning?.('Pilih Platform', { description: 'Pilih platform sumber tontonan' });
      return;
    }
    if (step === 3 && !state.content) {
      D.toast?.warning?.('Pilih Tontonan', { description: 'Pilih film atau serial yang ingin ditonton bareng' });
      return;
    }
    if (step === 4 && !state.selectedEpisode) {
      D.toast?.warning?.('Pilih Episode', { description: 'Pilih episode awal' });
      return;
    }
    if (step === 5) return; // Submit handled by btnSubmit
    // Before entering step 2, render platforms
    if (step === 1) renderPlatforms();
    // Before entering step 3, load content
    if (step === 2) loadContent();
    // Before entering step 4, load episodes (or skip for movies)
    if (step === 3) {
      if (state.contentType === 'movie') {
        // Movies: skip episode step, go to step 5
        state.selectedEpisode = 1;
        goToStep(5);
        return;
      }
      loadEpisodes();
    }
    goToStep(step + 1);
  }

  function handleBack() {
    const step = state.step;
    if (step <= 1) return;
    // If on step 4 for series and we go back to 3, that's fine
    // If on step 5 and we're a movie, go back to step 3 (skip episode step)
    if (step === 5 && state.contentType === 'movie') {
      goToStep(3);
      return;
    }
    goToStep(step - 1);
  }

  // ── Step 1: Content Type ───────────────────────────────────────────
  document.querySelectorAll('.wizard-type-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.wizard-type-card').forEach(c => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      state.contentType = card.dataset.type;
      state.platform = null;
      state.content = null;
      updateStepUI();
    });
  });

  // ── Step 2: Platform ───────────────────────────────────────────────
  const SERIAL_PLATFORMS = (D.SERIAL_PLATFORMS || []).map(p => ({
    id: p.id, label: p.label,
  }));
  const MOVIE_PLATFORMS = (D.MOVIE_PLATFORMS || []).map(p => ({
    id: p.id, label: p.label,
  }));

  function renderPlatforms() {
    if (!dom.platformGrid) return;
    const platforms = state.contentType === 'series' ? SERIAL_PLATFORMS : MOVIE_PLATFORMS;
    dom.platformGrid.innerHTML = platforms.map(p => `
      <button class="wizard-platform-card ${state.platform === p.id ? 'is-selected' : ''}" data-platform="${p.id}">
        <span class="wizard-platform-label">${escapeHtml(p.label)}</span>
      </button>
    `).join('');
    dom.platformGrid.querySelectorAll('.wizard-platform-card').forEach(btn => {
      btn.addEventListener('click', () => {
        dom.platformGrid.querySelectorAll('.wizard-platform-card').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        state.platform = btn.dataset.platform;
        state.content = null;
        updateStepUI();
      });
    });
  }

  // ── Step 3: Content Search/Browse ──────────────────────────────────
  let searchTimer = null;
  let contentLoadToken = 0;

  async function loadContent() {
    if (!dom.contentGrid || !state.platform) return;
    const token = ++contentLoadToken;
    dom.contentGrid.innerHTML = '';
    showContentStatus('loading', 'Memuat konten...');

    try {
      const api = D.Platforms[state.platform];
      if (!api) throw new Error('Platform tidak ditemukan');
      const res = await api.home(1, {});
      if (token !== contentLoadToken) return;
      const data = D.unwrap(res) || {};
      const items = data.items || [];
      if (items.length === 0) {
        showContentStatus('empty', 'Belum ada konten tersedia');
        return;
      }
      hideContentStatus();
      renderContentCards(items);
    } catch (err) {
      if (token !== contentLoadToken) return;
      console.error('[Party] Load content error:', err);
      showContentStatus('error', 'Gagal memuat konten. Coba lagi.');
    }
  }

  async function searchContent(query) {
    if (!dom.contentGrid || !state.platform) return;
    const token = ++contentLoadToken;

    if (!query || !query.trim()) {
      // Reload home content
      loadContent();
      return;
    }

    dom.contentGrid.innerHTML = '';
    showContentStatus('loading', 'Mencari...');

    try {
      const api = D.Platforms[state.platform];
      if (!api) throw new Error('Platform tidak ditemukan');
      const res = await api.search(query.trim());
      if (token !== contentLoadToken) return;
      const data = D.unwrap(res) || {};
      const items = data.items || [];
      if (items.length === 0) {
        showContentStatus('empty', `Tidak ditemukan hasil untuk "${escapeHtml(query)}"`);
        return;
      }
      hideContentStatus();
      renderContentCards(items);
    } catch (err) {
      if (token !== contentLoadToken) return;
      console.error('[Party] Search error:', err);
      showContentStatus('error', 'Gagal mencari. Coba lagi.');
    }
  }

  function renderContentCards(items) {
    if (!dom.contentGrid) return;
    dom.contentGrid.innerHTML = items.map((item, i) => {
      const title = getItemTitle(item);
      const cover = getItemCover(item);
      const id = item.id || '';
      const isSelected = state.content?.id === id;
      return `
        <button class="wizard-content-card ${isSelected ? 'is-selected' : ''}" data-idx="${i}">
          <div class="wizard-content-poster">
            ${cover ? `<img src="${cover}" alt="${escapeHtml(title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'" />` : ''}
            <div class="wizard-content-poster-fallback">${escapeHtml(title.charAt(0))}</div>
          </div>
          <div class="wizard-content-info">
            <span class="wizard-content-title">${escapeHtml(title)}</span>
          </div>
          <div class="wizard-content-check">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </button>
      `;
    }).join('');

    // Store items for click handling
    dom.contentGrid._items = items;

    dom.contentGrid.querySelectorAll('.wizard-content-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.idx, 10);
        const item = dom.contentGrid._items[idx];
        if (!item) return;
        dom.contentGrid.querySelectorAll('.wizard-content-card').forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        state.content = {
          id: item.id,
          title: getItemTitle(item),
          cover: getItemCover(item),
        };
        state.drama = null;
        state.episodes = [];
        state.selectedEpisode = 1;
        updateStepUI();
      });
    });
  }

  function showContentStatus(type, message) {
    if (!dom.contentStatus) return;
    dom.contentStatus.style.display = '';
    const loadingHtml = '<div class="wizard-loading-dots"><span></span><span></span><span></span></div>';
    const emptyHtml = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
    const errorHtml = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.4;color:var(--party-danger)"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    if (type === 'loading') dom.contentStatus.innerHTML = loadingHtml + `<span>${message}</span>`;
    else if (type === 'empty') dom.contentStatus.innerHTML = emptyHtml + `<span>${message}</span>`;
    else dom.contentStatus.innerHTML = errorHtml + `<span>${message}</span>`;
  }

  function hideContentStatus() {
    if (dom.contentStatus) dom.contentStatus.style.display = 'none';
  }

  // Search input handlers
  if (dom.searchInput) {
    dom.searchInput.addEventListener('input', () => {
      const val = dom.searchInput.value.trim();
      if (dom.searchClear) dom.searchClear.style.display = val ? '' : 'none';
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => searchContent(val), 400);
    });
    dom.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(searchTimer);
        searchContent(dom.searchInput.value);
      }
    });
  }
  if (dom.searchClear) {
    dom.searchClear.addEventListener('click', () => {
      dom.searchInput.value = '';
      dom.searchClear.style.display = 'none';
      clearTimeout(searchTimer);
      loadContent();
    });
  }

  // ── Step 4: Episode Picker ─────────────────────────────────────────
  async function loadEpisodes() {
    if (!dom.episodeGrid || !state.content || !state.platform) return;
    dom.episodeGrid.innerHTML = '';
    dom.selectedContent.innerHTML = `
      <div class="wizard-selected-info">
        <strong>${escapeHtml(state.content.title)}</strong>
        <span>${getPlatformLabel(state.platform)}</span>
      </div>
    `;

    dom.episodeGrid.innerHTML = '<div class="wizard-loading-dots"><span></span><span></span><span></span></div>';

    try {
      const api = D.Platforms[state.platform];
      if (!api) throw new Error('Platform tidak ditemukan');
      const res = await api.detail(state.content.id);
      const data = D.unwrap(res) || {};
      const drama = data.data || data;
      state.drama = drama;
      state.episodes = drama.episodes || data.episodes || [];

      renderEpisodeGrid();
    } catch (err) {
      console.error('[Party] Load episodes error:', err);
      dom.episodeGrid.innerHTML = `<p class="wizard-episode-error">Gagal memuat episode. Coba pilih konten lain.</p>`;
    }
  }

  function renderEpisodeGrid() {
    if (!dom.episodeGrid) return;
    if (state.episodes.length === 0) {
      dom.episodeGrid.innerHTML = '<p class="wizard-episode-error">Episode belum tersedia untuk konten ini.</p>';
      return;
    }

    const isOngoing = state.drama?.isOngoing;
    const currentEp = Number(state.drama?.currentEpisode || 0);

    dom.episodeGrid.innerHTML = state.episodes.map((ep, i) => {
      const num = ep.episode || ep.number || i + 1;
      const numVal = Number(num);
      const isDisabled = isOngoing && currentEp > 0 && numVal > currentEp;
      const isSelected = state.selectedEpisode === numVal;
      if (isDisabled) {
        return `<button class="wizard-ep-btn is-disabled" disabled>${num}</button>`;
      }
      return `<button class="wizard-ep-btn ${isSelected ? 'is-selected' : ''}" data-ep="${numVal}">${num}</button>`;
    }).join('');

    dom.episodeGrid.querySelectorAll('.wizard-ep-btn:not(.is-disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        dom.episodeGrid.querySelectorAll('.wizard-ep-btn').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        state.selectedEpisode = parseInt(btn.dataset.ep, 10);
        updateStepUI();
      });
    });
  }

  // ── Step 5: Room Configuration ─────────────────────────────────────
  function populateSummary() {
    if (!dom.summaryCard || !state.content) return;
    const cover = state.content.cover;
    dom.summaryCard.innerHTML = `
      <div class="wizard-summary-cover">
        ${cover ? `<img src="${cover}" alt="${escapeHtml(state.content.title)}" referrerpolicy="no-referrer" onerror="this.style.display='none'" />` : ''}
      </div>
      <div class="wizard-summary-info">
        <strong>${escapeHtml(state.content.title)}</strong>
        <span>${getPlatformLabel(state.platform)} · ${getContentTypeLabel(state.contentType)}${state.contentType === 'series' ? ` · Ep ${state.selectedEpisode}` : ''}</span>
      </div>
    `;
    // Auto-fill title
    if (dom.roomTitle && !dom.roomTitle.value.trim()) {
      dom.roomTitle.value = `Nobar ${state.content.title}`;
    }
  }

  // Duration chip selection
  if (dom.durationGrid) {
    dom.durationGrid.querySelectorAll('.wizard-duration-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        dom.durationGrid.querySelectorAll('.wizard-duration-chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        const val = chip.dataset.hours;
        if (val === 'custom') {
          state.duration = 0; // flag for custom
          if (dom.customDurationWrap) dom.customDurationWrap.style.display = '';
          // Parse existing values
          const h = parseInt(dom.customHours?.value || '1', 10);
          const m = parseInt(dom.customMinutes?.value || '0', 10);
          state.customHours = h >= 0 ? h : 1;
          state.customMinutes = m >= 0 ? m : 0;
          updateDurationPreview();
        } else {
          state.duration = parseInt(val, 10);
          if (dom.customDurationWrap) dom.customDurationWrap.style.display = 'none';
        }
      });
    });
  }

  // Time picker stepper buttons and inputs
  function updateDurationPreview() {
    const h = state.customHours || 0;
    const m = state.customMinutes || 0;
    const totalMins = h * 60 + m;
    let text;
    if (totalMins === 0) {
      text = 'Total: 0 menit';
    } else if (totalMins < 60) {
      text = `Total: ${totalMins} menit`;
    } else if (totalMins % 60 === 0) {
      text = `Total: ${totalMins / 60} jam`;
    } else {
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      text = `Total: ${hrs} jam ${mins} menit`;
    }
    if (dom.durationPreview) dom.durationPreview.textContent = text;
  }

  function clampTimeInput(inputEl, min, max) {
    let val = parseInt(inputEl.value, 10);
    if (isNaN(val)) val = min;
    val = Math.min(Math.max(val, min), max);
    inputEl.value = val;
    return val;
  }

  if (dom.customHours) {
    dom.customHours.addEventListener('input', () => {
      state.customHours = clampTimeInput(dom.customHours, 0, 168);
      updateDurationPreview();
    });
  }
  if (dom.customMinutes) {
    dom.customMinutes.addEventListener('input', () => {
      state.customMinutes = clampTimeInput(dom.customMinutes, 0, 59);
      updateDurationPreview();
    });
  }

  // Stepper button handlers
  document.querySelectorAll('.time-picker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'hours-dec') {
        const v = Math.max(0, (parseInt(dom.customHours?.value || '0', 10) || 0) - 1);
        if (dom.customHours) dom.customHours.value = v;
        state.customHours = v;
      } else if (action === 'hours-inc') {
        const v = Math.min(168, (parseInt(dom.customHours?.value || '0', 10) || 0) + 1);
        if (dom.customHours) dom.customHours.value = v;
        state.customHours = v;
      } else if (action === 'minutes-dec') {
        const v = Math.max(0, (parseInt(dom.customMinutes?.value || '0', 10) || 0) - 5);
        if (dom.customMinutes) dom.customMinutes.value = v;
        state.customMinutes = v;
      } else if (action === 'minutes-inc') {
        const v = Math.min(59, (parseInt(dom.customMinutes?.value || '0', 10) || 0) + 5);
        if (dom.customMinutes) dom.customMinutes.value = v;
        state.customMinutes = v;
      }
      updateDurationPreview();
    });
  });

  // Max participants validation (max 5)
  if (dom.maxParticipants) {
    dom.maxParticipants.addEventListener('input', () => {
      const val = parseInt(dom.maxParticipants.value, 10);
      const overLimit = val > 5;
      if (dom.maxParticipantsHint) {
        dom.maxParticipantsHint.style.display = overLimit ? '' : 'none';
      }
      dom.maxParticipants.classList.toggle('is-invalid', overLimit);
      if (dom.btnSubmit) dom.btnSubmit.disabled = overLimit;
    });
  }

  // ── Submit ─────────────────────────────────────────────────────────
  async function submitCreateRoom() {
    const title = dom.roomTitle?.value?.trim();
    if (!title) {
      D.toast?.warning?.('Judul Kosong', { description: 'Masukkan judul untuk room' });
      return;
    }
    if (!state.content || !state.platform || !state.contentType) {
      D.toast?.error?.('Data Tidak Lengkap', { description: 'Lengkapi semua langkah wizard' });
      return;
    }

    // Validate max participants
    const maxParts = parseInt(dom.maxParticipants?.value || '5', 10);
    if (maxParts > 5) {
      D.toast?.warning?.('Maks Peserta Berlebih', { description: 'Maksimum peserta adalah 5' });
      return;
    }

    // Calculate expires_in_hours: -1 for unlimited, custom uses minutes->hours fraction, or preset hours
    let expires_in_hours;
    if (state.duration === -1) {
      expires_in_hours = -1; // unlimited
    } else if (state.duration === 0) {
      // Custom duration: hours + minutes -> convert to fractional hours
      const h = state.customHours || parseInt(dom.customHours?.value || '0', 10);
      const m = state.customMinutes || parseInt(dom.customMinutes?.value || '0', 10);
      const totalMins = h * 60 + m;
      if (!totalMins || totalMins < 1) {
        D.toast?.warning?.('Durasi Tidak Valid', { description: 'Masukkan durasi minimal 1 menit' });
        return;
      }
      expires_in_hours = totalMins / 60; // convert to fractional hours
    } else {
      expires_in_hours = state.duration; // preset hours value
    }

    dom.btnSubmit.disabled = true;
    dom.btnSubmit.innerHTML = btnSpinner('Membuat...');

    try {
      const res = await fetch('/api/party/rooms', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title,
          content_type: state.contentType,
          platform: state.platform,
          content_id: state.content.id,
          content_title: state.content.title,
          current_episode: state.selectedEpisode,
          max_participants: maxParts,
          expires_in_hours,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat room');

      closeModal();
      D.toast?.success?.('Room Berhasil Dibuat', {
        description: `Kode room: ${data.room.code}. Bagikan ke teman!`
      });
      window.location.href = `/party/room/${data.room.id}`;
    } catch (err) {
      console.error('[Party] Create room error:', err);
      D.toast?.error?.('Gagal Membuat Room', { description: err.message });
    } finally {
      dom.btnSubmit.disabled = false;
      dom.btnSubmit.innerHTML = '<i data-lucide="sparkles" class="h-4 w-4"></i><span>Buat Room</span>';
      window.refreshIcons?.();
    }
  }

  // ── Event Listeners ────────────────────────────────────────────────
  dom.btnCreateRoom?.addEventListener('click', openModal);
  dom.btnClose?.addEventListener('click', closeModal);
  dom.btnBack?.addEventListener('click', handleBack);
  dom.btnBackBottom?.addEventListener('click', handleBack);
  dom.btnNext?.addEventListener('click', handleNext);
  dom.btnSubmit?.addEventListener('click', submitCreateRoom);
  dom.btnJoinRoom?.addEventListener('click', joinRoomByCode);
  dom.btnRefreshRooms?.addEventListener('click', loadRooms);

  dom.modal?.addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });

  // ── OTP Input Handlers ────────────────────────────────────────────────
  if (dom.otpWrap) {
    const boxes = dom.otpWrap.querySelectorAll('.party-otp-box');
    boxes.forEach((box, idx) => {
      box.addEventListener('input', () => {
        let v = box.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        box.value = v.slice(0, 1);
        // Sync hidden input
        if (dom.inputRoomCode) dom.inputRoomCode.value = getOtpCode();
        // Auto-advance
        if (v && idx < boxes.length - 1) {
          boxes[idx + 1].focus();
        }
      });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && idx > 0) {
          boxes[idx - 1].focus();
          boxes[idx - 1].value = '';
          if (dom.inputRoomCode) dom.inputRoomCode.value = getOtpCode();
        }
        if (e.key === 'ArrowLeft' && idx > 0) { boxes[idx - 1].focus(); }
        if (e.key === 'ArrowRight' && idx < boxes.length - 1) { boxes[idx + 1].focus(); }
        if (e.key === 'Enter') { e.preventDefault(); joinRoomByCode(); }
      });
      box.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData?.getData('text') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
        if (!text) return;
        setOtpCode(text);
        const nextIdx = Math.min(text.length, boxes.length - 1);
        boxes[nextIdx].focus();
      });
      box.addEventListener('focus', () => { box.select(); });
    });
    // Auto-focus first box
    if (boxes[0]) boxes[0].focus();
  }

  // Legacy: keep old input handler for non-OTP fallback
  if (dom.inputRoomCode && dom.inputRoomCode.type !== 'hidden') {
    dom.inputRoomCode.addEventListener('input', function () {
      this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });
    dom.inputRoomCode.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); joinRoomByCode(); }
    });
  }

  // ── Init ───────────────────────────────────────────────────────────
  loadRooms();
  window.refreshIcons?.();
})();
