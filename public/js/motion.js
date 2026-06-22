/* =====================================================================
   Dramova · Motion & Animation System
   GSAP-powered: page transitions, stagger, ripple, tilt, progress bar
   ===================================================================== */
(function () {
  'use strict';

  // ── Wait for GSAP ──────────────────────────────────────────────
  function whenGSAP(cb) {
    if (window.gsap) { cb(); return; }
    const t = setInterval(() => { if (window.gsap) { clearInterval(t); cb(); } }, 50);
  }

  // ── Page entrance animation ────────────────────────────────────
  function initPageEntrance() {
    const main = document.getElementById('mainContent');
    if (!main || !window.gsap) return;
    gsap.fromTo(main,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'all' }
    );
  }

  // ── Stagger reveal on scroll (IntersectionObserver + GSAP) ─────
  function initScrollReveal() {
    if (!window.gsap || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        observer.unobserve(el);
        const delay = parseFloat(el.dataset.revealDelay || '0');
        gsap.fromTo(el,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.5, delay, ease: 'power2.out', clearProps: 'all' }
        );
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('section, .reveal-on-scroll').forEach((el, i) => {
      el.dataset.revealDelay = (i * 0.05).toFixed(2);
      observer.observe(el);
    });
  }

  // ── Stagger grid cards ─────────────────────────────────────────
  function staggerGrid(container, delay = 0) {
    if (!window.gsap || !container) return;
    const cards = container.querySelectorAll('.poster-card, .block');
    if (!cards.length) return;
    gsap.fromTo(cards,
      { opacity: 0, y: 20, scale: 0.96 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.4,
        stagger: 0.04,
        delay,
        ease: 'power2.out',
        clearProps: 'all',
      }
    );
  }

  // ── Hero slide transition ──────────────────────────────────────
  function animateHeroIn(slide) {
    if (!window.gsap || !slide) return;
    const content = slide.querySelector('.absolute.inset-x-5');
    if (!content) return;
    gsap.fromTo(content,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', clearProps: 'all' }
    );
  }

  // ── Ripple effect on buttons ───────────────────────────────────
  function createRipple(e) {
    const btn = e.currentTarget;
    const existing = btn.querySelector('.ripple');
    if (existing) existing.remove();

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top  - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px; height: ${size}px;
      left: ${x}px; top: ${y}px;
      border-radius: 50%;
      background: rgba(255,255,255,0.12);
      transform: scale(0);
      animation: ripple-anim 0.55s ease-out forwards;
      pointer-events: none;
      z-index: 0;
    `;
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  function initRipples() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, a.poster-card, .bnav-item');
      if (btn && !btn.classList.contains('no-ripple')) {
        createRipple({ ...e, currentTarget: btn });
      }
    });
  }

  // ── Number counter animation ───────────────────────────────────
  function animateCounter(el, target, duration = 1.2) {
    if (!window.gsap || !el) return;
    gsap.fromTo({ val: 0 }, { val: target, duration, ease: 'power1.out',
      onUpdate: function () { el.textContent = Math.round(this.targets()[0].val); }
    });
  }

  // ── Poster card hover tilt (subtle 3D, desktop only) ──────────
  function initCardTilt() {
    return;

    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.poster-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width  / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `perspective(600px) rotateY(${dx * 4}deg) rotateX(${-dy * 4}deg) translateY(-4px)`;
    });

    document.addEventListener('mouseleave', (e) => {
      const card = e.target.closest('.poster-card');
      if (card) card.style.transform = '';
    }, true);
  }

  // ── Badge pop ─────────────────────────────────────────────────
  function popBadge(el) {
    if (!window.gsap || !el) return;
    gsap.fromTo(el,
      { scale: 1.4 },
      { scale: 1, duration: 0.35, ease: 'back.out(2)' }
    );
  }

  // ── Loading progress bar (top of page) ────────────────────────
  let progressBar = null;
  let progressTween = null;

  function showProgress() {
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.id = 'pageProgress';
      progressBar.style.cssText = `
        position: fixed; top: 0; left: 0; z-index: 9999;
        height: 2px; width: 0%;
        background: #2BA641;
        box-shadow: 0 0 8px rgba(43,166,65,0.6);
        pointer-events: none;
        transition: none;
      `;
      document.body.appendChild(progressBar);
    }
    progressBar.style.opacity = '1';
    progressBar.style.width = '0%';
    if (window.gsap) {
      if (progressTween) progressTween.kill();
      progressTween = gsap.to(progressBar, { width: '75%', duration: 1.5, ease: 'power1.out' });
    } else {
      progressBar.style.transition = 'width 1.5s ease';
      progressBar.style.width = '75%';
    }
  }

  function hideProgress() {
    if (!progressBar) return;
    if (window.gsap) {
      if (progressTween) progressTween.kill();
      gsap.to(progressBar, {
        width: '100%', duration: 0.25, ease: 'power1.in',
        onComplete: () => {
          gsap.to(progressBar, { opacity: 0, duration: 0.3, delay: 0.1,
            onComplete: () => { progressBar.style.width = '0%'; }
          });
        }
      });
    } else {
      progressBar.style.width = '100%';
      setTimeout(() => { progressBar.style.opacity = '0'; }, 300);
    }
  }

  // ── Sheet open/close animation ─────────────────────────────────
  function animateSheetIn(el) {
    if (!window.gsap || !el) return;
    gsap.fromTo(el,
      { y: '100%' },
      { y: '0%', duration: 0.35, ease: 'power3.out' }
    );
  }

  // ── Expose API ─────────────────────────────────────────────────
  window.Dramova = window.Dramova || {};
  Object.assign(window.Dramova, {
    motion: {
      staggerGrid,
      animateHeroIn,
      animateCounter,
      popBadge,
      showProgress,
      hideProgress,
      animateSheetIn,
    },
  });

  // ── Init on DOM ready ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    whenGSAP(() => {
      initPageEntrance();
      initScrollReveal();
      initRipples();
      initCardTilt();
    });
  });

})();
