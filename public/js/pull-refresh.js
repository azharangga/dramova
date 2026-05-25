/* Mobile pull-to-refresh gesture. */
(function () {
  const D = window.DramSi;
  const indicator = document.getElementById('pullRefreshIndicator');
  if (!indicator || !window.matchMedia('(max-width: 767px)').matches) return;

  let startY = 0;
  let pulling = false;
  let distance = 0;
  const threshold = 86;

  function atTop() {
    return window.scrollY <= 0 && document.documentElement.scrollTop <= 0;
  }

  function setDistance(value) {
    distance = Math.max(0, Math.min(value, 120));
    const pct = distance / threshold;
    indicator.classList.toggle('is-visible', distance > 8);
    indicator.classList.toggle('is-ready', distance >= threshold);
    indicator.style.transform = `translate(-50%, ${Math.min(distance * 0.45 - 18, 34)}px) scale(${0.9 + Math.min(pct, 1) * 0.12}) rotate(${distance * 2.2}deg)`;
  }

  window.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1 || !atTop() || document.body.classList.contains('is-watch')) return;
    startY = event.touches[0].clientY;
    pulling = true;
    distance = 0;
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    if (!pulling) return;
    const dy = event.touches[0].clientY - startY;
    setDistance(dy > 0 ? dy : 0);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (!pulling) return;
    pulling = false;
    if (distance >= threshold) {
      indicator.classList.add('is-refreshing', 'is-visible');
      D?.toast?.info?.(D?.t?.('common.refreshing') || 'Memuat ulang...');
      setTimeout(() => window.location.reload(), 180);
      return;
    }
    setDistance(0);
    setTimeout(() => indicator.classList.remove('is-visible', 'is-ready'), 120);
  }, { passive: true });
})();
