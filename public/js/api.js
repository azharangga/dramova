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
    const res = await fetch(`${root}${path}`, {
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
    });
    let data;
    try { data = await res.json(); } catch(e) {}
    
    if (!res.ok) {
      if (data && data.message) throw new Error(data.message);
      throw new Error('Request failed');
    }
    if (data && data.status === false) {
      if (data.message) throw new Error(data.message);
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

    const err = new Error(lastError?.message || friendlyError());
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

  const categoryPath = {
    dramanova: 'shorts/dramanova',
    goodshort: 'shorts/goodshort',
    dramabite: 'shorts/dramabite',
    dramabox: 'shorts/dramabox',
    kdrama: 'serial/kdrama',
    cdrama: 'serial/cdrama',
    varietyshow: 'serial/varietyshow',
    jdrama: 'serial/jdrama',
    thaidrama: 'serial/thaidrama',
    kmovie: 'movie/kmovie',
    cmovie: 'movie/cmovie',
    jmovie: 'movie/jmovie',
    thaimovie: 'movie/thaimovie',
  };

  function apiPath(platform, path) {
    return `/${categoryPath[platform]}${path}`;
  }

  function createSerialPlatform(platform, label) {
    return {
      label,
      orientation: 'horizontal',
      home: (page = 1, filters = {}) => getJSON(apiPath(platform, `/dramas?page=${page}&size=24${query(filters)}`)),
      more: (page, filters = {}) => getJSON(apiPath(platform, `/dramas?page=${page}&size=24${query(filters)}`)),
      filters: () => getJSON(apiPath(platform, '/filters?maxPages=12')),
      search: (q, filters = {}) => getJSON(apiPath(platform, `/search?q=${encodeURIComponent(q)}&page=1&size=24${query(filters)}`)),
      detail: (id) => getJSON(apiPath(platform, `/detail?id=${id}`)),
      stream: (id, ep) => getJSON(apiPath(platform, `/video?id=${id}&ep=${ep}`)),
    };
  }

  function createMoviePlatform(platform, label) {
    return {
      label,
      orientation: 'horizontal',
      home: (page = 1, filters = {}) => getJSON(apiPath(platform, `/dramas?page=${page}&size=24${query(filters)}`)),
      more: (page, filters = {}) => getJSON(apiPath(platform, `/dramas?page=${page}&size=24${query(filters)}`)),
      filters: () => getJSON(apiPath(platform, '/filters?maxPages=12')),
      search: (q, filters = {}) => getJSON(apiPath(platform, `/search?q=${encodeURIComponent(q)}&page=1&size=24${query(filters)}`)),
      detail: (id) => getJSON(apiPath(platform, `/detail?id=${id}`)),
      stream: (id) => getJSON(apiPath(platform, `/video?id=${id}`)),
    };
  }

  const Platforms = {
    dramanova: {
      label: 'DramaNova',
      orientation: 'horizontal',
      home: (page = 1, l) => getJSON(apiPath('dramanova', `/dramas?lang=${lang('dramanova', l)}&page=${page}&size=24`)),
      more: (page, l) => getJSON(apiPath('dramanova', `/dramas?lang=${lang('dramanova', l)}&page=${page}&size=24`)),
      search: (q, l) => getJSON(apiPath('dramanova', `/search?q=${encodeURIComponent(q)}&lang=${lang('dramanova', l)}`)),
      detail: (id, l) => getJSON(apiPath('dramanova', `/detail?id=${id}&lang=${lang('dramanova', l)}`)),
      stream: (id, ep, l) => getJSON(apiPath('dramanova', `/video?id=${id}&ep=${ep}&lang=${lang('dramanova', l)}`)),
    },

    goodshort: {
      label: 'GoodShort',
      orientation: 'vertical',
      home: (page = 1, l) => getJSON(apiPath('goodshort', `/home?page=${page}&channel=${lang('goodshort', l)}`)),
      more: (page, l) => getJSON(apiPath('goodshort', `/home?page=${page}&channel=${lang('goodshort', l)}`)),
      search: (q) => getJSON(apiPath('goodshort', `/search?q=${encodeURIComponent(q)}`)),
      detail: (id) => getJSON(apiPath('goodshort', `/detail?id=${id}`)),
      stream: (id, ep) => getJSON(apiPath('goodshort', `/stream_fast?id=${id}&ep=${ep}&quality=720p`)),
    },

    dramabite: {
      label: 'DramaBite',
      orientation: 'vertical',
      home: (page = 0, l) => getJSON(apiPath('dramabite', `/foryou?lang=${lang('dramabite', l)}&page=${page}`)),
      more: (page, l) => getJSON(apiPath('dramabite', `/foryou?lang=${lang('dramabite', l)}&page=${page}`)),
      search: (q, l) => getJSON(apiPath('dramabite', `/search?q=${encodeURIComponent(q)}&lang=${lang('dramabite', l)}`)),
      detail: (id, l) => getJSON(apiPath('dramabite', `/detail?id=${id}&lang=${lang('dramabite', l)}`)),
      stream: (id, ep, l) => getJSON(apiPath('dramabite', `/episode?id=${id}&ep=${ep}&lang=${lang('dramabite', l)}`)),
    },

    dramabox: {
      label: 'DramaBox',
      orientation: 'vertical',
      home: (page = 1, l) => getJSON(apiPath('dramabox', `/home?page=${page}&pageSize=24&lang=${lang('dramabox', l)}`)),
      more: (page, l) => getJSON(apiPath('dramabox', `/home?page=${page}&pageSize=24&lang=${lang('dramabox', l)}`)),
      search: (q, l) => getJSON(apiPath('dramabox', `/search?q=${encodeURIComponent(q)}&page=1&lang=${lang('dramabox', l)}`)),
      detail: (id, l) => getJSON(apiPath('dramabox', `/detail?id=${id}&lang=${lang('dramabox', l)}`)),
      stream: (id, ep, l) => getJSON(apiPath('dramabox', `/play?id=${id}&ep=${ep}&lang=${lang('dramabox', l)}`)),
    },

    kdrama: createSerialPlatform('kdrama', 'K-Drama'),
    cdrama: createSerialPlatform('cdrama', 'C-Drama'),
    varietyshow: createSerialPlatform('varietyshow', 'Variety Show'),
    jdrama: createSerialPlatform('jdrama', 'J-Drama'),
    thaidrama: createSerialPlatform('thaidrama', 'Thai Drama'),
    kmovie: createMoviePlatform('kmovie', 'K-Movie'),
    cmovie: createMoviePlatform('cmovie', 'C-Movie'),
    jmovie: createMoviePlatform('jmovie', 'J-Movie'),
    thaimovie: createMoviePlatform('thaimovie', 'Thai Movie'),
  };

  window.DramSi = window.DramSi || {};
  Object.assign(window.DramSi, { Platforms, unwrap, friendlyError });
})();
