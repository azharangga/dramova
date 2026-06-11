/* Detail page · movie info before watching. */
(function () {
  const D = window.DramSi;

  // Parse from path: /shorts/detail/:platform/:id or /series/detail/:platform/:id
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  // pathParts: ['shorts'|'series', 'detail', platform, ...id]
  const contentType = pathParts[0] || 'shorts'; // 'shorts' or 'series'
  const platform = pathParts[2] || D.getPlatform?.() || 'dramanova';
  const dramaId = decodeURIComponent(pathParts.slice(3).join('/') || '');

  const dom = {
    cover: document.getElementById('detailCover'),
    backdrop: document.getElementById('detailBackdrop'),
    metaRow: document.getElementById('detailMetaRow'),
    title: document.getElementById('detailTitle'),
    titleSkeleton: document.getElementById('detailTitleSkeleton'),
    synopsis: document.getElementById('detailSynopsis'),
    synopsisSkeleton: document.getElementById('detailSynopsisSkeleton'),
    synopsisToggle: document.getElementById('detailSynopsisToggle'),
    actions: document.getElementById('detailActions'),
    watchBtn: document.getElementById('detailWatchBtn'),
    shareBtn: document.getElementById('detailShareBtn'),
    favoriteBtn: document.getElementById('detailFavoriteBtn'),
    episodeGrid: document.getElementById('detailEpisodeGrid'),
    epCountLabel: document.getElementById('detailEpCountLabel'),
  };

  const state = { drama: null, episodes: [] };

  function watchUrl(ep = 1) {
    return `/${contentType}/watch/${platform}/${encodeURIComponent(dramaId)}?ep=${ep}`;
  }

  function setFavoriteButton() {
    if (!state.drama || !dom.favoriteBtn) return;
    const fav = D.isFavorite({ id: state.drama.id || dramaId, platform });
    const icon = dom.favoriteBtn.querySelector('[data-lucide]');
    if (fav) {
      dom.favoriteBtn.classList.add('is-active');
    } else {
      dom.favoriteBtn.classList.remove('is-active');
    }
    if (icon) icon.style.fill = fav ? 'currentColor' : 'none';
  }

  function renderEpisodes() {
    if (!state.episodes.length) {
      dom.episodeGrid.innerHTML = `<p class="empty-state">${D.t('common.episode_list_empty')}</p>`;
      return;
    }
    const isOngoing = state.drama?.isOngoing;
    const currentEpisode = Number(state.drama?.currentEpisode || 0);

    dom.episodeGrid.innerHTML = state.episodes.map((ep, i) => {
      const num = ep.episode || ep.number || i + 1;
      const numVal = Number(num);
      const isDisabled = isOngoing && currentEpisode > 0 && numVal > currentEpisode;

      const isNew = isOngoing && numVal === currentEpisode;

      if (isDisabled) {
        return `<a href="javascript:void(0)" onclick="window.DramSi?.toast?.warning?.('Episode Belum Rilis', { description: 'Episode ini belum tersedia.' }); event.preventDefault();" class="detail-ep-btn is-disabled" style="opacity:0.5; cursor:not-allowed;">${num}</a>`;
      }
      return `<a href="${watchUrl(num)}" class="detail-ep-btn relative" style="${isNew ? 'border: 1px solid rgba(245,158,11,0.5);' : ''}">
        ${num}
        ${isNew ? '<span class="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span></span>' : ''}
      </a>`;
    }).join('');
  }

  function syncSynopsisToggle() {
    if (!dom.synopsis || !dom.synopsisToggle) return;
    dom.synopsis.classList.add('is-collapsed');
    // Use double rAF to ensure layout is computed after content change
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const canExpand = dom.synopsis.scrollHeight > dom.synopsis.clientHeight + 2;
        dom.synopsisToggle.hidden = !canExpand;
        dom.synopsisToggle.textContent = D.t('common.read_more');
      });
    });
  }

  function openCastModal(cast) {
    // Remove existing modal
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
      <img src="${cast.photo}" alt="${cast.name}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(cast.name)}&size=512&background=random'; this.style.objectFit='contain';" referrerpolicy="no-referrer" class="cast-modal-img" />
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
    backdrop.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
    modal.querySelector('.cast-modal-close').addEventListener('click', close);
  }

  async function loadDetail() {
    if (!dramaId || !D.Platforms[platform]) {
      dom.title.textContent = D.t('common.not_found_title');
      dom.title.style.display = '';
      if (dom.titleSkeleton) dom.titleSkeleton.style.display = 'none';
      dom.synopsis.textContent = D.t('common.back_home_hint');
      dom.synopsis.style.display = '';
      if (dom.synopsisSkeleton) dom.synopsisSkeleton.style.display = 'none';
      dom.watchBtn.hidden = true;
      dom.actions.style.opacity = '1';
      dom.actions.style.pointerEvents = '';
      return;
    }

    dom.watchBtn.href = watchUrl(1);
    D.motion?.showProgress?.();

    try {
      const res = await D.Platforms[platform].detail(dramaId);
      const data = D.unwrap(res) || {};
      const drama = data.data || data;
      state.drama = drama;
      state.episodes = drama.episodes || data.episodes || [];

      const title = D.cleanTitle?.(drama.title || drama.bookName) || drama.title || drama.bookName || D.t('common.no_title');
      const synopsis = drama.synopsis || drama.description || drama.introduction || D.t('common.no_synopsis');
      const cover = drama.cover || drama.coverWap || drama.image || D.placeholderImg(title);

      // Hide skeletons, show real content
      if (dom.titleSkeleton) dom.titleSkeleton.style.display = 'none';
      dom.title.textContent = title;
      dom.title.style.display = '';

      if (dom.synopsisSkeleton) dom.synopsisSkeleton.style.display = 'none';
      dom.synopsis.textContent = synopsis;
      dom.synopsis.style.display = '';

      // Show meta badges
      const platformLabel = D.Platforms[platform].label || platform;
      const epText = state.episodes.length
        ? `${state.episodes.length} ${D.t('common.episodes')}`
        : D.t('common.episodes_unavailable');
      const isOngoing = drama.isOngoing;
      const ongoingLabel = isOngoing ? (drama.currentEpisode ? `Ongoing (Episode ${drama.currentEpisode})` : 'Ongoing') : '';

      dom.metaRow.innerHTML = `
        <span class="detail-tag">${platformLabel}</span>
        <span class="detail-tag detail-tag--muted">${epText}</span>
        ${isOngoing ? `<span class="detail-tag detail-tag--ongoing">${ongoingLabel}</span>` : ''}
      `;

      // Show actions
      dom.actions.style.opacity = '1';
      dom.actions.style.pointerEvents = '';

      dom.cover.src = cover;
      dom.cover.alt = title;
      dom.cover.onerror = () => { dom.cover.src = D.placeholderImg(title); };
      dom.cover.onload = () => {
        dom.cover.style.display = '';
        dom.cover.parentElement.classList.remove('skeleton');
      };
      // Fallback: if image is cached and onload already fired
      if (dom.cover.complete) {
        dom.cover.style.display = '';
        dom.cover.parentElement.classList.remove('skeleton');
      }

      // Set backdrop (same image, blurred via CSS)
      if (dom.backdrop) {
        dom.backdrop.src = cover;
        dom.backdrop.onerror = () => { dom.backdrop.style.display = 'none'; };
      }

      if (dom.epCountLabel) dom.epCountLabel.textContent = epText;

      // Render cast if available (series platforms only)
      const castList = drama.cast || [];
      const castContainer = document.getElementById('detailCast');
      if (castContainer && castList.length) {
        castContainer.innerHTML = `
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
        castContainer.hidden = false;

        // Click on cast photo → fullscreen modal
        castContainer.addEventListener('click', (e) => {
          const img = e.target.closest('.detail-cast-img');
          if (!img) return;
          const idx = parseInt(img.dataset.castIdx, 10);
          const c = castList[idx];
          if (!c || !c.photo) return;
          openCastModal(c);
        });
      }

      // Render details info if available
      const detailsInfo = drama.details || {};
      const detailsContainer = document.getElementById('detailInfo');
      if (detailsContainer && Object.keys(detailsInfo).length) {
        const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        function formatDate(str) {
          if (!str) return str;
          // Try parse "Month DD, YYYY" or "YYYY-MM-DD" etc.
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
        const rows = fields
          .filter((f) => detailsInfo[f.key])
          .map((f) => {
            let value = detailsInfo[f.key];
            value = value.replace(/\s*-+\s*$/, '');
            if (f.key === 'release_date') value = formatDate(value);
            return `<span class="detail-info-chip"><strong>${f.label}:</strong> ${value}</span>`;
          })
          .join('');
        if (rows) {
          detailsContainer.innerHTML = rows;
          detailsContainer.hidden = false;
        }
      }

      renderEpisodes();
      syncSynopsisToggle();
      setFavoriteButton();
      window.refreshIcons?.();
      D.motion?.hideProgress?.();
    } catch (err) {
      const message = err.message || D.friendlyError?.() || D.t('common.detail_load_error');
      const msgLower = message.toLowerCase();
      if (msgLower.includes('bukan') || msgLower.includes('tidak dikenal') || msgLower.includes('tidak ditemukan')) {
        D.toast?.error?.(message);
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.replace('/');
        }
        return;
      }
      if (dom.titleSkeleton) dom.titleSkeleton.style.display = 'none';
      dom.title.textContent = D.t('common.info_unavailable');
      dom.title.style.display = '';
      if (dom.synopsisSkeleton) dom.synopsisSkeleton.style.display = 'none';
      dom.synopsis.textContent = message;
      dom.synopsis.style.display = '';
      dom.watchBtn.hidden = true;
      dom.cover.style.display = '';
      dom.cover.parentElement.classList.remove('skeleton');
      dom.episodeGrid.innerHTML = `<div class="empty-state">${message}</div>`;
      D.toast?.error?.(message);
      D.motion?.hideProgress?.();
    }
  }

  dom.favoriteBtn?.addEventListener('click', () => {
    if (!state.drama) return;
    const title = D.cleanTitle?.(state.drama.title || state.drama.bookName) || state.drama.title || state.drama.bookName || D.t('common.no_title');
    const added = D.toggleFavorite({
      id: state.drama.id || dramaId,
      platform,
      title,
      cover: state.drama.cover || state.drama.coverWap || '',
      episodes: state.episodes.length,
    });
    setFavoriteButton();
    D.toast?.[added ? 'success' : 'info']?.(D.t(added ? 'common.favorite_added' : 'common.favorite_removed', { title }));
  });

  dom.synopsisToggle?.addEventListener('click', () => {
    const expanded = dom.synopsis.classList.toggle('is-expanded');
    dom.synopsis.classList.toggle('is-collapsed', !expanded);
    dom.synopsisToggle.textContent = expanded ? D.t('common.read_less') : D.t('common.read_more');
  });

  dom.shareBtn?.addEventListener('click', () => {
    const title = dom.title?.textContent || 'Dramova';
    D.openShareSheet?.(title, window.location.href);
  });

  loadDetail();
})();
