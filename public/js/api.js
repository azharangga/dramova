/**
 * Dramova · API helper.
 * Setiap method bisa dipanggil dengan langOverride; default ikut bahasa global.
 * API calls go through Next.js API routes (/api/*) which proxy to backend.
 */
(function () {
  const root = window.location.origin + '/api';

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function friendlyError() {
    if (navigator && navigator.onLine === false) {
      return 'Tidak ada koneksi internet.';
    }
    return 'Gagal memuat konten.';
  }

  async function requestJSON(path) {
    const res = await fetch(`${root}${path}`, { credentials: 'omit' });
    if (!res.ok) throw new Error('Request failed');
    const data = await res.json();
    if (data && data.status === false) {
      throw new Error('Request failed');
    }
    return data;
  }

  async function getJSON(path, opts = {}) {
    const retries = opts.retries ?? 1;
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await requestJSON(path);
      } catch (err) {
        lastError = err;
        if (attempt < retries) await sleep(650);
      }
    }

    const err = new Error(friendlyError());
    err.cause = lastError;
    throw err;
  }

  function unwrap(envelope) {
    if (!envelope || envelope.status === false) return null;
    return envelope.result || envelope;
  }

  function lang(platform, override) {
    if (override) return override;
    return (window.DramSi && window.DramSi.langFor(platform)) || 'id';
  }

  function query(extra = {}) {
    const params = new URLSearchParams();
    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim()) {
        params.set(key, value);
      }
    });
    const text = params.toString();
    return text ? `&${text}` : '';
  }

  const Platforms = {
    dramanova: {
      label: 'DramaNova',
      orientation: 'horizontal',
      home: (page = 1, l) => getJSON(`/dramanova/dramas?lang=${lang('dramanova', l)}&page=${page}&size=24`),
      more: (page, l) => getJSON(`/dramanova/dramas?lang=${lang('dramanova', l)}&page=${page}&size=24`),
      search: (q, l) => getJSON(`/dramanova/search?q=${encodeURIComponent(q)}&lang=${lang('dramanova', l)}`),
      detail: (id, l) => getJSON(`/dramanova/detail?id=${id}&lang=${lang('dramanova', l)}`),
      stream: (id, ep, l) => getJSON(`/dramanova/video?id=${id}&ep=${ep}&lang=${lang('dramanova', l)}`),
    },

    goodshort: {
      label: 'GoodShort',
      orientation: 'vertical',
      home: (page = 1, l) => getJSON(`/goodshort/home?page=${page}&channel=${lang('goodshort', l)}`),
      more: (page, l) => getJSON(`/goodshort/home?page=${page}&channel=${lang('goodshort', l)}`),
      search: (q) => getJSON(`/goodshort/search?q=${encodeURIComponent(q)}`),
      detail: (id) => getJSON(`/goodshort/detail?id=${id}`),
      stream: (id, ep) => getJSON(`/goodshort/stream_fast?id=${id}&ep=${ep}&quality=720p`),
    },

    dramabite: {
      label: 'DramaBite',
      orientation: 'vertical',
      home: (page = 0, l) => getJSON(`/dramabite/foryou?lang=${lang('dramabite', l)}&page=${page}`),
      more: (page, l) => getJSON(`/dramabite/foryou?lang=${lang('dramabite', l)}&page=${page}`),
      search: (q, l) => getJSON(`/dramabite/search?q=${encodeURIComponent(q)}&lang=${lang('dramabite', l)}`),
      detail: (id, l) => getJSON(`/dramabite/detail?id=${id}&lang=${lang('dramabite', l)}`),
      stream: (id, ep, l) => getJSON(`/dramabite/episode?id=${id}&ep=${ep}&lang=${lang('dramabite', l)}`),
    },

    dramabox: {
      label: 'DramaBox',
      orientation: 'vertical',
      home: (page = 1, l) => getJSON(`/dramabox/home?page=${page}&pageSize=24&lang=${lang('dramabox', l)}`),
      more: (page, l) => getJSON(`/dramabox/home?page=${page}&pageSize=24&lang=${lang('dramabox', l)}`),
      search: (q, l) => getJSON(`/dramabox/search?q=${encodeURIComponent(q)}&page=1&lang=${lang('dramabox', l)}`),
      detail: (id, l) => getJSON(`/dramabox/detail?id=${id}&lang=${lang('dramabox', l)}`),
      stream: (id, ep, l) => getJSON(`/dramabox/play?id=${id}&ep=${ep}&lang=${lang('dramabox', l)}`),
    },

    kdrama: {
      label: 'K-Drama',
      orientation: 'horizontal',
      home: (page = 1, filters = {}) => getJSON(`/kdrama/dramas?page=${page}&size=24${query(filters)}`),
      more: (page, filters = {}) => getJSON(`/kdrama/dramas?page=${page}&size=24${query(filters)}`),
      filters: () => getJSON('/kdrama/filters?maxPages=12'),
      search: (q, filters = {}) => getJSON(`/kdrama/search?q=${encodeURIComponent(q)}&page=1&size=24${query(filters)}`),
      detail: (id) => getJSON(`/kdrama/detail?id=${id}`),
      stream: (id, ep) => getJSON(`/kdrama/video?id=${id}&ep=${ep}`),
    },
  };

  window.DramSi = window.DramSi || {};
  Object.assign(window.DramSi, { Platforms, unwrap, friendlyError });
})();
