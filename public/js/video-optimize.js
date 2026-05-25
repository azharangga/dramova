/* =====================================================================
   Video Optimization · Global video performance utilities.
   Auto-loaded after core scripts. Applies to all pages with video.
   ===================================================================== */
(function () {
  'use strict';
  var D = window.DramSi;

  // ── Network quality detection ────────────────────────────────
  function getNetworkQuality() {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return 'good';

    // effectiveType: 'slow-2g', '2g', '3g', '4g'
    var etype = conn.effectiveType || '4g';
    if (etype === '4g') return 'good';
    if (etype === '3g') return 'medium';
    return 'poor'; // 2g, slow-2g

    // Also check downlink (Mbps)
    // var dl = conn.downlink || 10;
    // if (dl >= 5) return 'good';
    // if (dl >= 1.5) return 'medium';
    // return 'poor';
  }

  // ── Preferred quality based on network ───────────────────────
  function getPreferredQuality() {
    var quality = getNetworkQuality();
    switch (quality) {
      case 'good': return '720p';
      case 'medium': return '480p';
      case 'poor': return '360p';
      default: return '720p';
    }
  }

  // ── Pick best quality from qualityList ───────────────────────
  function pickQuality(qualityList) {
    if (!qualityList || !qualityList.length) return null;

    var preferred = getPreferredQuality();
    var preferredNum = parseInt(preferred) || 720;

    // Sort by quality number
    var sorted = qualityList.slice().sort(function (a, b) {
      return (parseInt(a.quality || a.label) || 9999) - (parseInt(b.quality || b.label) || 9999);
    });

    // Find closest quality <= preferred
    var best = null;
    for (var i = 0; i < sorted.length; i++) {
      var q = parseInt(sorted[i].quality || sorted[i].label) || 0;
      if (q <= preferredNum) best = sorted[i];
    }

    return best || sorted[0];
  }

  // ── Optimal HLS.js config based on network ───────────────────
  function getHlsConfig() {
    var quality = getNetworkQuality();
    var base = { enableWorker: true, lowLatencyMode: true };

    switch (quality) {
      case 'good':
        return Object.assign(base, {
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000, // 60MB
          startLevel: -1, // auto
        });
      case 'medium':
        return Object.assign(base, {
          maxBufferLength: 15,
          maxMaxBufferLength: 30,
          maxBufferSize: 30 * 1000 * 1000, // 30MB
          startLevel: 0, // lowest
          capLevelToPlayerSize: true,
        });
      case 'poor':
        return Object.assign(base, {
          maxBufferLength: 8,
          maxMaxBufferLength: 15,
          maxBufferSize: 15 * 1000 * 1000, // 15MB
          startLevel: 0,
          capLevelToPlayerSize: true,
          lowLatencyMode: false,
        });
      default:
        return Object.assign(base, {
          maxBufferLength: 20,
          maxMaxBufferLength: 40,
        });
    }
  }

  // ── Visibility-based video management ────────────────────────
  // Pause all videos when page is hidden, resume when visible
  var pausedByVisibility = [];

  document.addEventListener('visibilitychange', function () {
    var videos = document.querySelectorAll('video');
    if (document.hidden) {
      // Page hidden → pause playing videos to save bandwidth/battery
      pausedByVisibility = [];
      for (var i = 0; i < videos.length; i++) {
        if (!videos[i].paused && videos[i].src) {
          videos[i].pause();
          pausedByVisibility.push(videos[i]);
        }
      }
    } else {
      // Page visible → resume videos that we paused
      for (var j = 0; j < pausedByVisibility.length; j++) {
        var v = pausedByVisibility[j];
        if (v.paused && v.src && document.contains(v)) {
          v.play().catch(function () {});
        }
      }
      pausedByVisibility = [];
    }
  });

  // ── Memory cleanup: destroy detached video elements ──────────
  // Periodically check for video elements that are no longer in DOM
  setInterval(function () {
    var videos = document.querySelectorAll('video');
    for (var i = 0; i < videos.length; i++) {
      var v = videos[i];
      // If video has source but is not in viewport and not playing, free buffer
      if (v.src && v.paused && !v.closest('.is-playing') && v.buffered.length > 0) {
        var rect = v.getBoundingClientRect();
        var inViewport = rect.top < window.innerHeight + 500 && rect.bottom > -500;
        if (!inViewport) {
          // Far from viewport — release buffer to save memory
          v.preload = 'none';
        }
      }
    }
  }, 10000); // Every 10 seconds

  // ── Data saver mode ──────────────────────────────────────────
  function isDataSaverOn() {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return conn && conn.saveData === true;
  }

  // ── Battery-aware quality ────────────────────────────────────
  function checkBattery(callback) {
    if (!navigator.getBattery) { callback(null); return; }
    navigator.getBattery().then(function (battery) {
      callback({
        level: battery.level, // 0-1
        charging: battery.charging,
      });
    }).catch(function () { callback(null); });
  }

  // Adjust quality if battery is low
  function getAdjustedQuality(qualityList) {
    var picked = pickQuality(qualityList);
    // If data saver is on, always pick lowest
    if (isDataSaverOn() && qualityList && qualityList.length) {
      var sorted = qualityList.slice().sort(function (a, b) {
        return (parseInt(a.quality || a.label) || 9999) - (parseInt(b.quality || b.label) || 9999);
      });
      return sorted[0];
    }
    return picked;
  }

  // ── Preload strategy based on network ────────────────────────
  function getPreloadStrategy() {
    var quality = getNetworkQuality();
    switch (quality) {
      case 'good': return { prefetchCount: 3, preload: 'auto' };
      case 'medium': return { prefetchCount: 1, preload: 'metadata' };
      case 'poor': return { prefetchCount: 0, preload: 'none' };
      default: return { prefetchCount: 2, preload: 'auto' };
    }
  }

  // ── Export ───────────────────────────────────────────────────
  D = window.DramSi = window.DramSi || {};
  Object.assign(D, {
    videoOpt: {
      getNetworkQuality: getNetworkQuality,
      getPreferredQuality: getPreferredQuality,
      pickQuality: pickQuality,
      getHlsConfig: getHlsConfig,
      getAdjustedQuality: getAdjustedQuality,
      getPreloadStrategy: getPreloadStrategy,
      isDataSaverOn: isDataSaverOn,
      checkBattery: checkBattery,
    },
  });
})();
