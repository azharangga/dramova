/* Library page · history & favorites from localStorage. */
(function () {
  const D = window.DramSi;
  const grid    = document.getElementById('libraryGrid');
  const empty   = document.getElementById('libraryEmpty');
  const chips   = document.querySelectorAll('.lib-chip');
  const clearBtn = document.getElementById('clearLibBtn');

  let activeTab = 'recent';

  function syncChips() {
    chips.forEach((c) => {
      const active = c.dataset.tab === activeTab;
      c.style.background  = active ? 'var(--accent-control-bg)' : 'var(--control-bg)';
      c.style.color       = active ? 'var(--accent-control-text)' : 'var(--control-text)';
      c.style.borderColor = active ? 'var(--accent-control-border)' : 'var(--border-muted)';
      c.classList.toggle('is-active', active);
    });
  }

  function load() {
    const items = activeTab === 'favorite' ? D.getFavorites() : D.getHistory();
    if (clearBtn) clearBtn.hidden = items.length === 0;
    if (!items.length) {
      grid.innerHTML = '';
      empty.hidden = false;
      window.refreshIcons?.();
      return;
    }
    empty.hidden = true;
    grid.innerHTML = items.map((it) => D.buildPoster(it, it.platform || 'dramanova')).join('');
    window.refreshIcons?.();
    // Stagger animation
    D.motion?.staggerGrid?.(grid);
  }

  chips.forEach((c) => {
    c.addEventListener('click', () => {
      activeTab = c.dataset.tab;
      syncChips();
      load();
    });
  });

  clearBtn?.addEventListener('click', async () => {
    const label = D.t(activeTab === 'favorite' ? 'library.favorite_label' : 'library.history_label');
    const ok = await D.confirm?.(D.t('library.clear_confirm', { label }), {
      title: D.t('common.confirm'),
      confirmLabel: D.t('common.delete'),
      cancelLabel: D.t('common.cancel'),
      danger: true,
    }) ?? window.confirm(`Hapus semua ${label}?`);

    if (!ok) return;
    if (activeTab === 'favorite') localStorage.removeItem(D.STORAGE.LIBRARY);
    else localStorage.removeItem(D.STORAGE.HISTORY);
    load();
    document.dispatchEvent(new CustomEvent('library:updated'));
    D.toast?.success(D.t('library.clear_success', { label }));
  });

  syncChips();
  load();
})();
