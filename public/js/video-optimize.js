/* =====================================================================
   Video Optimization · Global video performance utilities.
   Auto-loaded after core scripts. Applies to all pages with video.
   ===================================================================== */
(function () {
  'use strict';
  var D = window.Dramova;

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
    var base = {
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90, // Increase back buffer to save re-downloads
      maxFragLookUpTolerance: 0.25,
      progressive: true,
      fragLoadingMaxRetry: 6, // More retries for intermittent network
      manifestLoadingMaxRetry: 6,
      levelLoadingMaxRetry: 6,
      fragLoadingRetryDelay: 1000,
      manifestLoadingRetryDelay: 1000,
      levelLoadingRetryDelay: 1000,
      startLevel: -1, // Auto level by default
    };

    switch (quality) {
      case 'good':
        return Object.assign(base, {
          maxBufferLength: 60, // Increase forward buffer (60s)
          maxMaxBufferLength: 120, // Max 2 minutes buffer
          maxBufferSize: 100 * 1000 * 1000, // 100MB max memory
        });
      case 'medium':
        return Object.assign(base, {
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 50 * 1000 * 1000, // 50MB
          capLevelToPlayerSize: true,
        });
      case 'poor':
        return Object.assign(base, {
          maxBufferLength: 15,
          maxMaxBufferLength: 30,
          maxBufferSize: 25 * 1000 * 1000, // 25MB
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
        if (videos[i].id === 'video' || videos[i].closest('#watchRoot')) continue;
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
  var audioGraphs = new WeakMap();

  function enhanceAudio(video) {
    if (!video || audioGraphs.has(video)) return false;
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    try {
      var ctx = new AudioCtx();
      var source = ctx.createMediaElementSource(video);
      var highpass = ctx.createBiquadFilter();
      var compressor = ctx.createDynamicsCompressor();
      var gain = ctx.createGain();

      highpass.type = 'highpass';
      highpass.frequency.value = 45;
      highpass.Q.value = 0.7;
      compressor.threshold.value = -24;
      compressor.knee.value = 24;
      compressor.ratio.value = 2.2;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.22;
      gain.gain.value = 1.04;

      source.connect(highpass);
      highpass.connect(compressor);
      compressor.connect(gain);
      gain.connect(ctx.destination);

      function resumeAudio() {
        if (ctx.state === 'suspended') ctx.resume().catch(function () {});
      }
      video.addEventListener('play', resumeAudio);
      video.addEventListener('click', resumeAudio);
      audioGraphs.set(video, { ctx: ctx, source: source, highpass: highpass, compressor: compressor, gain: gain });
      return true;
    } catch (_) {
      return false;
    }
  }

  D = window.Dramova = window.Dramova || {};
  Object.assign(D, {
    videoOpt: {
      getNetworkQuality: getNetworkQuality,
      getPreferredQuality: getPreferredQuality,
      pickQuality: pickQuality,
      getHlsConfig: getHlsConfig,
      getAdjustedQuality: getAdjustedQuality,
      getPreloadStrategy: getPreloadStrategy,
      enhanceAudio: enhanceAudio,
      isDataSaverOn: isDataSaverOn,
      checkBattery: checkBattery,
    },
  });
})();
