/* =====================================================================
   Dramova · PWA Manager
   - Service Worker registration
   - Install prompt (beforeinstallprompt)
   - Update notification
   - Online/offline status toast
   - Install button in Library page
   ===================================================================== */
(function () {
  'use strict';

  const D = window.DramSi;

  let deferredPrompt = null;
  let swRegistration = null;
  let refreshing = false;

  // ── Register Service Worker ────────────────────────────────────
  async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
      swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      // Check for updates
      swRegistration.addEventListener('updatefound', () => {
        const newWorker = swRegistration.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            activateUpdate(newWorker);
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      swRegistration.update();
      startRealtimeUpdateChecks();
      console.log('[PWA] Service Worker registered');
    } catch (err) {
      console.warn('[PWA] SW registration failed:', err);
    }
  }

  // ── Update banner ──────────────────────────────────────────────
  function activateUpdate(worker) {
    worker?.postMessage({ type: 'SKIP_WAITING' });
  }

  function startRealtimeUpdateChecks() {
    if (!swRegistration) return;

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) swRegistration.update();
    });
    window.addEventListener('focus', () => swRegistration.update());
    window.addEventListener('online', () => swRegistration.update());

    setInterval(() => {
      if (!document.hidden && navigator.onLine !== false) {
        swRegistration.update();
      }
    }, 60 * 1000);
  }

  // ── Install prompt ─────────────────────────────────────────────
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Show install button wherever it exists
    document.querySelectorAll('.pwa-install-btn').forEach((btn) => {
      btn.hidden = false;
      btn.style.display = '';
    });
    // Dispatch event so pages can react
    document.dispatchEvent(new CustomEvent('pwa:installable'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    document.querySelectorAll('.pwa-install-btn').forEach((btn) => {
      btn.hidden = true;
    });
    D?.toast?.success('Dramova berhasil diinstall!');
    document.dispatchEvent(new CustomEvent('pwa:installed'));
  });

  async function triggerInstall() {
    if (!deferredPrompt) {
      D?.toast?.info('Buka menu browser → "Tambahkan ke layar utama"');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') {
      D?.toast?.success('Menginstall Dramova…');
    }
  }

  // ── Online / Offline status ────────────────────────────────────
  let offlineToast = null;

  window.addEventListener('offline', () => {
    offlineToast = D?.toast?.warning('Kamu sedang offline. Beberapa konten mungkin tidak tersedia.', {
      persistent: true,
      id: 'offline-status',
    });
    document.body.classList.add('is-offline');
  });

  window.addEventListener('online', () => {
    offlineToast?.dismiss();
    offlineToast = null;
    D?.toast?.success('Koneksi kembali!', { duration: 2500 });
    document.body.classList.remove('is-offline');
  });

  // ── Expose ─────────────────────────────────────────────────────
  window.DramSi = window.DramSi || {};
  window.DramSi.pwa = {
    triggerInstall,
    isInstallable: () => !!deferredPrompt,
    isInstalled: () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true,
  };

  // ── Init ───────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    registerSW();

    // Wire up any install buttons already in DOM
    document.querySelectorAll('.pwa-install-btn').forEach((btn) => {
      btn.addEventListener('click', triggerInstall);
    });

    // Listen for dynamically added install buttons
    document.addEventListener('pwa:installable', () => {
      document.querySelectorAll('.pwa-install-btn').forEach((btn) => {
        btn.hidden = false;
        btn.addEventListener('click', triggerInstall);
      });
    });
  });

})();
