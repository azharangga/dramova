/* =====================================================================
   Dramova · Toast System
   Style: clean pill/card, icon circle, bottom-center (mobile) / top-right (desktop)
   ===================================================================== */
(function () {
  'use strict';

  let container = null;

  function getContainer() {
    if (container && document.body.contains(container)) return container;
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);
    return container;
  }

  // ── Icon circles (filled background, white icon) ───────────────
  const ICON_BG = {
    success: '#2BA641',
    error:   '#f3727f',
    warning: '#ffa42b',
    info:    '#539df5',
    loading: '#4d4d4d',
  };

  const ICONS_SVG = {
    success: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    warning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    loading: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" style="animation:toastSpin 0.8s linear infinite"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>`,
  };

  // ── Detect dark/light mode ─────────────────────────────────────
  function isDark() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }

  function getColors() {
    if (isDark()) {
      return {
        bg:     '#1f1f1f',
        text:   '#ffffff',
        subtext:'#b3b3b3',
        border: 'rgba(255,255,255,0.08)',
        shadow: 'rgba(0,0,0,0.55) 0px 8px 32px',
        close:  '#4d4d4d',
        closeHover: '#b3b3b3',
        actionColor: (type) => ICON_BG[type] || ICON_BG.info,
      };
    }
    return {
      bg:     '#ffffff',
      text:   '#111111',
      subtext:'#666666',
      border: 'rgba(0,0,0,0.08)',
      shadow: 'rgba(0,0,0,0.12) 0px 8px 32px',
      close:  '#aaaaaa',
      closeHover: '#333333',
      actionColor: (type) => ICON_BG[type] || ICON_BG.info,
    };
  }

  // ── Core show ──────────────────────────────────────────────────
  function show(message, type = 'info', options = {}) {
    const {
      duration   = type === 'loading' ? 0 : 3000,
      action     = null,
      id         = null,
      persistent = false,
      subtitle   = null,
    } = options;

    const c = getContainer();
    if (id) {
      const ex = c.querySelector(`[data-toast-id="${id}"]`);
      if (ex) dismiss(ex, true);
    }

    const colors = getColors();
    const isMobile = window.innerWidth < 640;

    const toast = document.createElement('div');
    toast.setAttribute('role', 'alert');
    if (id) toast.dataset.toastId = id;

    toast.style.cssText = `
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 100px;
      background: ${colors.bg};
      border: 1px solid ${colors.border};
      box-shadow: ${colors.shadow};
      max-width: ${isMobile ? 'calc(100vw - 32px)' : '360px'};
      min-width: ${isMobile ? '200px' : '240px'};
      cursor: pointer;
      user-select: none;
      opacity: 0;
      will-change: transform, opacity;
      transition: opacity 0.22s ease, transform 0.22s ease;
      ${isMobile
        ? 'transform: translateY(12px);'
        : 'transform: translateX(16px);'}
    `;

    // Icon circle
    const iconWrap = document.createElement('div');
    iconWrap.style.cssText = `
      flex-shrink: 0;
      width: 28px; height: 28px;
      border-radius: 50%;
      background: ${ICON_BG[type] || ICON_BG.info};
      display: flex; align-items: center; justify-content: center;
    `;
    iconWrap.innerHTML = ICONS_SVG[type] || ICONS_SVG.info;

    // Text block
    const textWrap = document.createElement('div');
    textWrap.style.cssText = `flex: 1; min-width: 0;`;
    textWrap.innerHTML = `
      <p style="font-size:14px;font-weight:600;color:${colors.text};line-height:1.35;margin:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${message}</p>
      ${subtitle ? `<p style="font-size:12px;color:${colors.subtext};margin:2px 0 0;line-height:1.3;">${subtitle}</p>` : ''}
      ${action ? `<button class="toast-action" style="margin-top:6px;font-size:12px;font-weight:700;color:${colors.actionColor(type)};background:none;border:none;padding:0;cursor:pointer;letter-spacing:0.5px;">${action.label}</button>` : ''}
    `;

    toast.appendChild(iconWrap);
    toast.appendChild(textWrap);

    // Close button (only non-persistent)
    if (!persistent && type !== 'loading') {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'toast-close';
      closeBtn.setAttribute('aria-label', window.DramSi?.t?.('common.close') || 'Tutup');
      closeBtn.style.cssText = `
        flex-shrink: 0;
        background: none; border: none;
        padding: 2px; cursor: pointer;
        color: ${colors.close};
        transition: color 0.15s;
        display: flex; align-items: center;
      `;
      closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      closeBtn.addEventListener('mouseenter', () => closeBtn.style.color = colors.closeHover);
      closeBtn.addEventListener('mouseleave', () => closeBtn.style.color = colors.close);
      closeBtn.addEventListener('click', (e) => { e.stopPropagation(); dismiss(toast); });
      toast.appendChild(closeBtn);
    }

    c.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0) translateX(0)';
      });
    });

    if (window.gsap) {
      if (isMobile) {
        gsap.fromTo(toast, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' });
      } else {
        gsap.fromTo(toast, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out' });
      }
    }

    // Action
    const actionBtn = toast.querySelector('.toast-action');
    if (actionBtn && action?.onClick) {
      actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        action.onClick();
        dismiss(toast);
      });
    }

    // Click to dismiss
    toast.addEventListener('click', () => { if (type !== 'loading') dismiss(toast); });

    // Auto-dismiss
    let dismissTimer = null;
    if (duration > 0 && !persistent) {
      dismissTimer = setTimeout(() => dismiss(toast), duration);
    }

    return {
      dismiss: () => { clearTimeout(dismissTimer); dismiss(toast); },
      update: (newMsg) => {
        const p = toast.querySelector('p');
        if (p) p.textContent = newMsg;
      },
    };
  }

  function dismiss(toast, immediate = false) {
    if (!toast || !toast.parentNode) return;
    if (immediate) { toast.remove(); return; }
    const isMobile = window.innerWidth < 640;
    if (window.gsap) {
      gsap.to(toast, {
        opacity: 0,
        ...(isMobile ? { y: 12 } : { x: 16 }),
        duration: 0.22, ease: 'power2.in',
        onComplete: () => toast.remove(),
      });
    } else {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 240);
    }
  }

  // ── Shorthand ──────────────────────────────────────────────────
  const toast = {
    show,
    success: (msg, opts) => show(msg, 'success', opts),
    error:   (msg, opts) => show(msg, 'error',   { duration: 5000, ...opts }),
    warning: (msg, opts) => show(msg, 'warning', opts),
    info:    (msg, opts) => show(msg, 'info',    opts),
    loading: (msg, opts) => show(msg, 'loading', { persistent: true, ...opts }),
    dismiss,
  };

  // ── Confirm dialog ─────────────────────────────────────────────
  function confirm(message, { title = 'Konfirmasi', confirmLabel = 'Ya', cancelLabel = 'Batal', danger = false } = {}) {
    return new Promise((resolve) => {
      const colors = getColors();
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position:fixed;inset:0;z-index:99998;
        background:rgba(0,0,0,0.65);
        display:flex;align-items:center;justify-content:center;
        padding:16px;
        backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
        opacity:0;transition:opacity 0.2s ease;
      `;
      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.style.cssText = `
        background:${colors.bg};
        border:1px solid ${colors.border};
        border-radius:20px;
        padding:24px;
        max-width:340px;width:100%;
        box-shadow:${colors.shadow};
        transform:scale(0.92);
        transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
      `;
      dialog.innerHTML = `
        <h3 style="font-size:16px;font-weight:700;color:${colors.text};margin:0 0 8px;">${title}</h3>
        <p style="font-size:14px;color:${colors.subtext};margin:0 0 20px;line-height:1.5;">${message}</p>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button id="confirmCancel" style="padding:10px 20px;border-radius:9999px;border:1px solid ${colors.border};background:transparent;color:${colors.subtext};font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s;">${cancelLabel}</button>
          <button id="confirmOk" style="padding:10px 20px;border-radius:9999px;border:1px solid ${danger ? '#f3727f' : 'var(--accent-control-border)'};background:${danger ? '#f3727f' : 'var(--accent-control-bg)'};color:${danger ? '#fff' : 'var(--accent-control-text)'};font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s;">${confirmLabel}</button>
        </div>
      `;
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        dialog.style.transform = 'scale(1)';
      }));
      function close(result) {
        overlay.style.opacity = '0';
        dialog.style.transform = 'scale(0.92)';
        setTimeout(() => { overlay.remove(); resolve(result); }, 220);
      }
      dialog.querySelector('#confirmOk').addEventListener('click', () => close(true));
      dialog.querySelector('#confirmCancel').addEventListener('click', () => close(false));
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    });
  }

  // ── Expose ─────────────────────────────────────────────────────
  window.DramSi = window.DramSi || {};
  window.DramSi.toast   = toast;
  window.DramSi.confirm = confirm;

})();
