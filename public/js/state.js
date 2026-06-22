/* =====================================================================
   Dramova · Global state, i18n, persistent storage helpers.
   ===================================================================== */
(function () {
  const STORAGE = {
    LANG:     'dramova.lang',
    PLATFORM: 'dramova.platform',
    LIBRARY:  'dramova.library',
    HISTORY:  'dramova.history',
    THEME:    'dramova.theme',
    HOME_CAT: 'dramova.home_cat',
    SHORTS_PLATFORM: 'dramova.shorts_platform',
    DISCOVER_CAT: 'dramova.discover_cat',
  };

  const LANGS = [
    { code: 'id', label: 'Bahasa Indonesia', short: 'ID' },
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'ko', label: '한국어', short: 'KO' },
    { code: 'pt', label: 'Português', short: 'PT' },
    { code: 'th', label: 'ภาษาไทย', short: 'TH' },
  ];

  // Mapping bahasa global ke parameter masing-masing platform.
  // Beberapa platform pakai kode "in" untuk Indonesia, sebagian "id".
  const LANG_MAP = {
    id: { goodshort: 'id', dramabite: 'id', dramanova: 'in', dramabox: 'in', kdrama: 'id', cdrama: 'id', varietyshow: 'id', jdrama: 'id', thaidrama: 'id', kmovie: 'id', cmovie: 'id', jmovie: 'id', thaimovie: 'id' },
    en: { goodshort: 'en', dramabite: 'en', dramanova: 'en', dramabox: 'en', kdrama: 'id', cdrama: 'id', varietyshow: 'id', jdrama: 'id', thaidrama: 'id', kmovie: 'id', cmovie: 'id', jmovie: 'id', thaimovie: 'id' },
    ko: { goodshort: 'kr', dramabite: 'ko', dramanova: 'ko', dramabox: 'ko', kdrama: 'id', cdrama: 'id', varietyshow: 'id', jdrama: 'id', thaidrama: 'id', kmovie: 'id', cmovie: 'id', jmovie: 'id', thaimovie: 'id' },
    pt: { goodshort: 'pt', dramabite: 'pt', dramanova: 'pt', dramabox: 'pt', kdrama: 'id', cdrama: 'id', varietyshow: 'id', jdrama: 'id', thaidrama: 'id', kmovie: 'id', cmovie: 'id', jmovie: 'id', thaimovie: 'id' },
    th: { goodshort: 'th', dramabite: 'th', dramanova: 'th', dramabox: 'th', kdrama: 'id', cdrama: 'id', varietyshow: 'id', jdrama: 'id', thaidrama: 'id', kmovie: 'id', cmovie: 'id', jmovie: 'id', thaimovie: 'id' },
  };

  const I18N = {
    id: {
      'home.trending': 'Sedang Trending',
      'home.trending_sub': 'Konten paling banyak ditonton sekarang.',
      'home.new': 'Rilis Baru',
      'home.new_sub': 'Film dan serial segar yang baru ditambahkan.',
      'home.for_you': 'Untuk Kamu',
      'home.for_you_sub': 'Pilihan terkurasi dari semua platform.',
      'home.see_all': 'Lihat semua →',
      'serial.kicker': 'Katalog',
      'serial.title': 'Serial',
      'serial.sub': 'Temukan serial terpopuler.',
      'serial.search_placeholder': 'Cari judul serial...',
      'serial.search_button': 'Cari',
      'serial.filter_year_all': 'Semua Tahun',
      'serial.filter_reset': 'Reset',
      'serial.trending': 'Sedang Trending',
      'serial.trending_sub': 'Serial pilihan yang lagi ramai ditonton.',
      'serial.new': 'Rilis Baru',
      'serial.new_sub': 'Judul terbaru dari katalog serial.',
      'serial.for_you': 'Untuk Kamu',
      'serial.for_you_sub': 'Lebih banyak serial untuk ditonton.',
      'serial.empty': 'Belum ada daftar serial.',
      'serial.empty_data': 'Belum ada data.',
      'serial.hero_fallback': 'Serial pilihan.',
      'serial.load_error': 'Gagal memuat serial.',
      'discover.title': 'Jelajahi',
      'discover.sub': 'Temukan film dan serial dari semua platform.',
      'search.hint': 'Ketik judul, atau coba: CEO, balas dendam, romansa.',
      'library.title': 'Riwayat & Favorit',
      'library.sub': 'Drama yang baru kamu tonton akan muncul di sini.',
      'library.recent': 'Baru ditonton',
      'library.favorite': 'Favorit',
      'library.empty_title': 'Belum ada riwayat.',
      'library.empty_sub': 'Mulai tonton drama pertamamu di Beranda.',
      'common.load_more': 'Muat lebih banyak',
      'common.retry': 'Coba lagi',
      'common.watch_now': 'Tonton sekarang',
      'common.episodes': 'episode',
      'player.loading': 'Memuat video…',
      'player.episodes': 'Episode',
      'player.prev': 'Sebelumnya',
      'player.next': 'Berikutnya',
      'player.favorite': 'Favoritkan',
      'sheet.lang': 'Bahasa',
      'sheet.platform': 'Pilih Platform',
    },
    en: {
      'home.trending': 'Trending Now',
      'home.trending_sub': 'Most watched right now.',
      'home.new': 'New Releases',
      'home.new_sub': 'Fresh dramas just added.',
      'home.for_you': 'For You',
      'home.for_you_sub': 'Curated picks across platforms.',
      'home.see_all': 'See all →',
      'serial.kicker': 'Catalog',
      'serial.title': 'Series',
      'serial.sub': 'Explore popular series.',
      'serial.search_placeholder': 'Search series titles...',
      'serial.search_button': 'Search',
      'serial.filter_year_all': 'All Years',
      'serial.filter_reset': 'Reset',
      'serial.trending': 'Trending Now',
      'serial.trending_sub': 'Series people are watching right now.',
      'serial.new': 'New Releases',
      'serial.new_sub': 'Fresh titles from the series catalog.',
      'serial.for_you': 'For You',
      'serial.for_you_sub': 'More series to watch.',
      'serial.empty': 'No series list yet.',
      'serial.empty_data': 'No data yet.',
      'serial.hero_fallback': 'Selected series.',
      'serial.load_error': 'Failed to load series.',
      'discover.title': 'Discover',
      'discover.sub': 'Browse dramas across all platforms.',
      'search.hint': 'Type a title or try: CEO, revenge, romance.',
      'library.title': 'History & Favorites',
      'library.sub': 'Recently watched dramas show up here.',
      'library.recent': 'Recent',
      'library.favorite': 'Favorites',
      'library.empty_title': 'Nothing here yet.',
      'library.empty_sub': 'Start watching from the home page.',
      'common.load_more': 'Load more',
      'common.retry': 'Retry',
      'common.watch_now': 'Watch now',
      'common.episodes': 'episodes',
      'player.loading': 'Loading video…',
      'player.episodes': 'Episodes',
      'player.prev': 'Previous',
      'player.next': 'Next',
      'player.favorite': 'Favorite',
      'sheet.lang': 'Language',
      'sheet.platform': 'Choose Platform',
    },
    ko: {
      'home.trending': '지금 인기',
      'home.trending_sub': '지금 가장 많이 시청한 콘텐츠.',
      'home.new': '신규 공개',
      'home.new_sub': '새롭게 추가된 드라마.',
      'home.for_you': '추천',
      'home.for_you_sub': '모든 플랫폼에서 고른 추천작.',
      'home.see_all': '전체 보기 →',
      'serial.kicker': '카탈로그',
      'serial.title': '시리즈',
      'serial.sub': '인기 시리즈를 찾아보세요.',
      'serial.search_placeholder': '시리즈 제목 검색...',
      'serial.search_button': '검색',
      'serial.filter_year_all': '모든 연도',
      'serial.filter_reset': '초기화',
      'serial.trending': '지금 인기',
      'serial.trending_sub': '지금 많이 보는 시리즈.',
      'serial.new': '신규 공개',
      'serial.new_sub': '시리즈 카탈로그의 최신 작품.',
      'serial.for_you': '추천',
      'serial.for_you_sub': '더 많은 시리즈를 감상하세요.',
      'serial.empty': '아직 시리즈 목록이 없습니다.',
      'serial.empty_data': '아직 데이터가 없습니다.',
      'serial.hero_fallback': '추천 시리즈.',
      'serial.load_error': '시리즈를 불러오지 못했습니다.',
      'discover.title': '탐색',
      'discover.sub': '모든 플랫폼의 드라마를 찾아보세요.',
      'search.hint': '제목을 입력하거나 CEO, 복수, 로맨스를 검색해 보세요.',
      'library.title': '시청 기록 & 즐겨찾기',
      'library.sub': '최근 시청한 드라마가 여기에 표시됩니다.',
      'library.recent': '최근 시청',
      'library.favorite': '즐겨찾기',
      'library.empty_title': '아직 기록이 없습니다.',
      'library.empty_sub': '홈에서 첫 드라마를 시청해 보세요.',
      'common.load_more': '더 보기',
      'common.retry': '다시 시도',
      'common.watch_now': '지금 보기',
      'common.episodes': '회',
      'player.loading': '동영상 로딩 중…',
      'player.episodes': '에피소드',
      'player.prev': '이전',
      'player.next': '다음',
      'player.favorite': '즐겨찾기',
      'sheet.lang': '언어',
      'sheet.platform': '플랫폼 선택',
    },
    pt: {
      'home.trending': 'Em alta',
      'home.trending_sub': 'Mais assistidos no momento.',
      'home.new': 'Novidades',
      'home.new_sub': 'Dramas recém-adicionados.',
      'home.for_you': 'Para Você',
      'home.for_you_sub': 'Seleção entre todas as plataformas.',
      'home.see_all': 'Ver tudo →',
      'serial.kicker': 'Catálogo',
      'serial.title': 'Series',
      'serial.sub': 'Encontre series populares.',
      'serial.search_placeholder': 'Buscar titulos de series...',
      'serial.search_button': 'Buscar',
      'serial.filter_year_all': 'Todos os anos',
      'serial.filter_reset': 'Redefinir',
      'serial.trending': 'Em alta',
      'serial.trending_sub': 'Series que estao sendo assistidas agora.',
      'serial.new': 'Novidades',
      'serial.new_sub': 'Titulos recentes do catalogo de series.',
      'serial.for_you': 'Para Você',
      'serial.for_you_sub': 'Mais series para assistir.',
      'serial.empty': 'Ainda nao ha lista de series.',
      'serial.empty_data': 'Sem dados por enquanto.',
      'serial.hero_fallback': 'Serie selecionada.',
      'serial.load_error': 'Nao foi possivel carregar series. Tente novamente em breve.',
      'discover.title': 'Descobrir',
      'discover.sub': 'Explore dramas em todas as plataformas.',
      'search.hint': 'Digite um título ou tente: CEO, vingança, romance.',
      'library.title': 'Histórico e Favoritos',
      'library.sub': 'Dramas vistos recentemente aparecem aqui.',
      'library.recent': 'Recentes',
      'library.favorite': 'Favoritos',
      'library.empty_title': 'Vazio por enquanto.',
      'library.empty_sub': 'Comece a assistir na página inicial.',
      'common.load_more': 'Carregar mais',
      'common.retry': 'Tentar novamente',
      'common.watch_now': 'Assistir',
      'common.episodes': 'episódios',
      'player.loading': 'Carregando vídeo…',
      'player.episodes': 'Episódios',
      'player.prev': 'Anterior',
      'player.next': 'Próximo',
      'player.favorite': 'Favoritar',
      'sheet.lang': 'Idioma',
      'sheet.platform': 'Escolher plataforma',
    },
    th: {
      'home.trending': 'มาแรง',
      'home.trending_sub': 'ดูมากที่สุดตอนนี้',
      'home.new': 'มาใหม่',
      'home.new_sub': 'ละครใหม่ล่าสุด',
      'home.for_you': 'สำหรับคุณ',
      'home.for_you_sub': 'คัดเลือกจากทุกแพลตฟอร์ม',
      'home.see_all': 'ดูทั้งหมด →',
      'serial.kicker': 'แคตตาล็อก',
      'serial.title': 'ซีรีส์',
      'serial.sub': 'ค้นหาซีรีส์ยอดนิยม',
      'serial.search_placeholder': 'ค้นหาชื่อซีรีส์...',
      'serial.search_button': 'ค้นหา',
      'serial.filter_year_all': 'ทุกปี',
      'serial.filter_reset': 'รีเซ็ต',
      'serial.trending': 'กำลังนิยม',
      'serial.trending_sub': 'ซีรีส์ที่คนกำลังดูตอนนี้',
      'serial.new': 'มาใหม่',
      'serial.new_sub': 'ซีรีส์ล่าสุดจากแคตตาล็อก',
      'serial.for_you': 'สำหรับคุณ',
      'serial.for_you_sub': 'ซีรีส์อื่นๆ ให้คุณดู',
      'serial.empty': 'ยังไม่มีรายการซีรีส์',
      'serial.empty_data': 'ยังไม่มีข้อมูล',
      'serial.hero_fallback': 'ซีรีส์แนะนำ',
      'serial.load_error': 'โหลดซีรีส์ไม่สำเร็จ',
      'discover.title': 'สำรวจ',
      'discover.sub': 'ค้นหาละครจากทุกแพลตฟอร์ม',
      'search.hint': 'พิมพ์ชื่อเรื่อง หรือลอง: CEO, แก้แค้น, โรแมนติก',
      'library.title': 'ประวัติ & รายการโปรด',
      'library.sub': 'ละครที่คุณดูล่าสุดจะปรากฏที่นี่',
      'library.recent': 'ดูล่าสุด',
      'library.favorite': 'รายการโปรด',
      'library.empty_title': 'ยังไม่มีประวัติ',
      'library.empty_sub': 'เริ่มดูละครเรื่องแรกของคุณที่หน้าแรก',
      'common.load_more': 'โหลดเพิ่ม',
      'common.retry': 'ลองอีกครั้ง',
      'common.watch_now': 'ดูเลย',
      'common.episodes': 'ตอน',
      'player.loading': 'กำลังโหลดวิดีโอ…',
      'player.episodes': 'ตอน',
      'player.prev': 'ก่อนหน้า',
      'player.next': 'ถัดไป',
      'player.favorite': 'ถูกใจ',
      'sheet.lang': 'ภาษา',
      'sheet.platform': 'เลือกแพลตฟอร์ม',
    },
  };

  Object.assign(I18N.en, {
    'serial.kicker': 'Catalog',
    'serial.title': 'Series',
    'serial.sub': 'Find popular long-form series.',
    'serial.search_placeholder': 'Search series titles...',
    'serial.search_button': 'Search',
    'serial.filter_year_all': 'All Years',
    'serial.filter_reset': 'Reset',
    'serial.trending': 'Trending Now',
    'serial.trending_sub': 'Series people are watching right now.',
    'serial.new': 'New Releases',
    'serial.new_sub': 'Fresh titles from the series catalog.',
    'serial.for_you': 'For You',
    'serial.for_you_sub': 'More series to watch.',
    'serial.empty': 'No series list yet.',
    'serial.empty_data': 'No data yet.',
    'serial.hero_fallback': 'Selected series.',
    'serial.load_error': 'Failed to load series.',
  });

  Object.assign(I18N.ko, {
    'serial.kicker': '카탈로그',
    'serial.title': '시리즈',
    'serial.sub': '인기 시리즈를 찾아보세요.',
    'serial.search_placeholder': '시리즈 제목 검색...',
    'serial.search_button': '검색',
    'serial.filter_year_all': '모든 연도',
    'serial.filter_reset': '초기화',
    'serial.trending': '지금 인기',
    'serial.trending_sub': '지금 많이 보는 시리즈.',
    'serial.new': '신규 공개',
    'serial.new_sub': '시리즈 카탈로그의 최신 작품.',
    'serial.for_you': '추천',
    'serial.for_you_sub': '더 많은 시리즈를 감상하세요.',
    'serial.empty': '아직 시리즈 목록이 없습니다.',
    'serial.empty_data': '아직 데이터가 없습니다.',
    'serial.hero_fallback': '추천 시리즈.',
    'serial.load_error': '시리즈를 불러오지 못했습니다.',
  });

  Object.assign(I18N.id, {
    'nav.home': 'Beranda',
    'nav.shorts': 'Shorts',
    'nav.discover': 'Jelajahi',
    'nav.serial': 'Serial',
    'nav.search': 'Cari',
    'nav.history': 'Riwayat',
    'nav.footer': 'Navigasi',
    'footer.description': 'Platform streaming film dan serial modern untuk menikmati berbagai cerita menarik dalam pengalaman menonton yang nyaman, ringan, dan immersive.',
    'footer.features': 'Fitur Utama',
    'footer.feature.platforms': 'Drama pendek dan serial dalam satu tempat',
    'footer.feature.languages': 'Cari judul dari berbagai katalog',
    'footer.feature.history': 'Lanjutkan tontonan dan simpan favorit',
    'footer.made_with': 'Dibuat dengan Flask.',
    'common.close': 'Tutup',
    'common.choose': 'Pilih',
    'common.clear': 'Hapus',
    'common.reset': 'Reset',
    'common.share': 'Bagikan',
    'common.back_to_top': 'Kembali ke atas',
    'common.copied': 'Link disalin!',
    'common.no_title': 'Tanpa judul',
    'common.no_synopsis': 'Belum ada sinopsis untuk drama ini.',
    'common.not_found_title': 'Drama tidak ditemukan',
    'common.back_home_hint': 'Buka kembali dari Beranda.',
    'common.info_unavailable': 'Info belum tersedia',
    'common.detail_load_error': 'Gagal memuat info drama.',
    'common.episodes_unavailable': 'Episode belum tersedia',
    'common.episode_list_empty': 'Daftar episode belum tersedia.',
    'common.no_data': 'Belum ada data.',
    'common.retry': 'Coba lagi',
    'common.refreshing': 'Menyegarkan...',
    'theme.light': 'Aktifkan mode terang',
    'theme.dark': 'Aktifkan mode gelap',
    'search.empty_title': 'Tidak ada hasil untuk "{keyword}"',
    'search.empty_sub': 'Coba platform lain atau ubah kata kunci.',
    'discover.empty': 'Belum ada hasil dari platform ini.',
    'discover.cat_title': 'Kategori',
    'discover.cat_all': 'Semua Kategori',
    'discover.cat_shorts_sub': 'Drama pendek',
    'discover.cat_serial_sub': 'Drama serial',
    'common.read_more': 'Selengkapnya',
    'common.read_less': 'Tampilkan lebih sedikit',
    'common.confirm': 'Konfirmasi',
    'common.delete': 'Hapus',
    'common.cancel': 'Batal',
    'common.favorite_added': '"{title}" ditambahkan ke favorit.',
    'common.favorite_removed': '"{title}" dihapus dari favorit.',
    'library.clear_confirm': 'Hapus semua {label}?',
    'library.clear_success': '{label} berhasil dihapus.',
    'library.history_label': 'riwayat',
    'library.favorite_label': 'favorit',
    'library.clear': 'Hapus',
    'library.continue_watching': 'Lanjutkan menonton',
    'detail.loading_episode': 'Memuat episode...',
    'detail.loading_title': 'Memuat informasi drama...',
    'detail.loading_synopsis': 'Mohon tunggu sebentar.',
    'detail.watch_now': 'Tonton sekarang',
    'detail.cast': 'Pemeran',
    'detail.episode_sub': 'Pilih episode untuk mulai menonton.',
    'player.invalid_params': 'Parameter tidak valid',
    'player.invalid_hint': 'Buka kembali dari Beranda.',
    'player.video_unavailable': 'Video untuk episode ini belum tersedia.',
    'player.unsupported': 'Browser kamu belum mendukung format video ini.',
    'player.content_error': 'Gagal memuat konten.',
    'player.drama_load_error': 'Gagal memuat drama.',
    'player.episode_locked': 'Episode ini terkunci atau tidak tersedia.',
    'player.episode_unavailable': 'Episode ini belum tersedia untuk ditonton.',
    'player.video_load_error': 'Gagal memuat video.',
    'player.video_play_error': 'Video belum bisa diputar.',
    'player.resume_from': 'Lanjut dari Ep {ep} · {time}.',
    'player.speed': 'Kecepatan',
    'player.quality': 'Kualitas',
    'player.swipe_hint': 'Geser untuk ganti episode',
    'home.kicker': 'Streaming Drama',
    'home.title': 'Dramova',
    'home.sub': 'Platform streaming film dan serial modern untuk menikmati berbagai cerita menarik dalam pengalaman menonton yang nyaman, ringan, dan immersive.',
    'discover.kicker': 'Katalog',
    'discover.sub': 'Telusuri katalog drama lintas platform.',
    'search.kicker': 'Pencarian',
    'search.title': 'Cari Film & Serial',
    'search.sub': 'Temukan film dan serial dari berbagai platform dalam satu pencarian. Gunakan filter untuk mempersempit katalog sesuai sumber tontonan.',
    'search.placeholder': 'Cari film, serial, judul, kata kunci...',
    'search.platform_title': 'Platform',
    'search.all_platforms': 'Semua platform',
    'search.all_platforms_sub': 'Gabungkan hasil pencarian',
    'library.kicker': 'Riwayat',
    'library.sub': 'Kelola tontonan terakhir dan drama favorit dalam satu tempat agar mudah melanjutkan episode berikutnya.',
    'serial.kicker': 'Serial',
    'serial.sub': 'Jelajahi katalog serial dengan pencarian judul, filter tahun, dan koleksi pilihan yang mudah dipindai.',
  });

  Object.assign(I18N.en, {
    'nav.home': 'Home',
    'nav.shorts': 'Shorts',
    'nav.discover': 'Discover',
    'nav.serial': 'Series',
    'nav.search': 'Search',
    'nav.history': 'History',
    'nav.footer': 'Navigation',
    'footer.description': 'A modern drama streaming platform for short stories, selected series, and favorite watches in a light, comfortable experience.',
    'footer.features': 'Key Features',
    'footer.feature.platforms': 'Short dramas and series in one place',
    'footer.feature.languages': 'Search titles across catalogs',
    'footer.feature.history': 'Continue watching and save favorites',
    'footer.made_with': 'Made with Flask.',
    'common.close': 'Close',
    'common.choose': 'Choose',
    'common.clear': 'Clear',
    'common.reset': 'Reset',
    'common.share': 'Share',
    'common.back_to_top': 'Back to top',
    'common.copied': 'Link copied!',
    'common.no_title': 'Untitled',
    'common.no_synopsis': 'No synopsis is available for this drama yet.',
    'common.not_found_title': 'Drama not found',
    'common.back_home_hint': 'Open it again from the home page.',
    'common.info_unavailable': 'Info unavailable',
    'common.detail_load_error': 'Drama info could not be loaded. Try again shortly.',
    'common.episodes_unavailable': 'Episodes unavailable',
    'common.episode_list_empty': 'Episode list is not available yet.',
    'common.no_data': 'No data yet.',
    'common.retry': 'Retry',
    'common.refreshing': 'Refreshing...',
    'theme.light': 'Switch to light mode',
    'theme.dark': 'Switch to dark mode',
    'search.empty_title': 'No results for "{keyword}"',
    'search.empty_sub': 'Try another platform or change the keyword.',
    'discover.empty': 'No results from this platform yet.',
    'discover.cat_title': 'Category',
    'discover.cat_all': 'All Categories',
    'discover.cat_shorts_sub': 'Short dramas',
    'discover.cat_serial_sub': 'Drama series',
    'common.read_more': 'Read more',
    'common.read_less': 'Show less',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.cancel': 'Cancel',
    'common.favorite_added': '"{title}" added to favorites.',
    'common.favorite_removed': '"{title}" removed from favorites.',
    'library.clear_confirm': 'Delete all {label}?',
    'library.clear_success': '{label} cleared.',
    'library.history_label': 'history',
    'library.favorite_label': 'favorites',
    'library.clear': 'Clear',
    'library.continue_watching': 'Continue Watching',
    'detail.loading_episode': 'Loading episodes...',
    'detail.loading_title': 'Loading drama info...',
    'detail.loading_synopsis': 'Please wait a moment.',
    'detail.watch_now': 'Watch Now',
    'detail.cast': 'Cast',
    'detail.episode_sub': 'Choose an episode to start watching.',
    'player.invalid_params': 'Invalid parameters',
    'player.invalid_hint': 'Open it again from the home page.',
    'player.video_unavailable': 'Video is not available for this episode.',
    'player.unsupported': 'Your browser does not support this video format yet.',
    'player.content_error': 'Content could not be loaded. Please reload shortly.',
    'player.drama_load_error': 'Drama could not be loaded. Try again shortly.',
    'player.episode_locked': 'This episode is locked or unavailable.',
    'player.episode_unavailable': 'This episode is not available to watch yet.',
    'player.video_load_error': 'Video could not be loaded. Try selecting this episode again shortly.',
    'player.video_play_error': 'Video could not be played. Try selecting this episode again shortly.',
    'player.resume_from': 'Resumed from Ep {ep} · {time}.',
    'player.speed': 'Speed',
    'player.quality': 'Quality',
    'player.swipe_hint': 'Swipe to change episode',
    'home.kicker': 'Drama Streaming',
    'home.title': 'Dramova',
    'home.sub': 'Discover, continue, and save movies and series from multiple platforms in a lightweight daily viewing experience.',
    'discover.kicker': 'Catalog',
    'discover.sub': 'Browse dramas across all platforms.',
    'search.kicker': 'Search',
    'search.title': 'Find Dramas',
    'search.sub': 'Search dramas across multiple platforms in one place, then narrow the catalog by source when needed.',
    'search.placeholder': 'Search dramas, titles, keywords...',
    'search.platform_title': 'Platform',
    'search.all_platforms': 'All platforms',
    'search.all_platforms_sub': 'Combine search results',
    'library.kicker': 'Collection',
    'library.sub': 'Manage recent watches and favorites in one place so it is easy to continue the next episode.',
    'serial.kicker': 'Series',
    'serial.sub': 'Explore series with search, year filtering, and curated sections that are easy to scan.',
  });

  Object.assign(I18N.ko, {
    'nav.home': '홈',
    'nav.shorts': 'Shorts',
    'nav.discover': '탐색',
    'nav.serial': '시리즈',
    'nav.search': '검색',
    'nav.history': '기록',
    'nav.footer': '내비게이션',
    'footer.description': '짧은 드라마부터 인기 시리즈까지, 가볍고 편안한 시청 경험을 제공하는 현대적인 드라마 스트리밍 플랫폼.',
    'footer.features': '주요 기능',
    'footer.feature.platforms': '짧은 드라마와 시리즈를 한 곳에서',
    'footer.feature.languages': '여러 카탈로그에서 제목 검색',
    'footer.feature.history': '이어보기 및 즐겨찾기 저장',
    'footer.made_with': 'Flask로 제작.',
    'common.close': '닫기',
    'common.choose': '선택',
    'common.clear': '지우기',
    'common.reset': '초기화',
    'common.share': '공유',
    'common.back_to_top': '맨 위로',
    'common.copied': '링크가 복사되었습니다!',
    'common.no_title': '제목 없음',
    'common.no_synopsis': '이 드라마의 시놉시스가 아직 없습니다.',
    'common.not_found_title': '드라마를 찾을 수 없습니다',
    'common.back_home_hint': '홈에서 다시 열어주세요.',
    'common.info_unavailable': '정보 없음',
    'common.detail_load_error': '드라마 정보를 불러오지 못했습니다.',
    'common.episodes_unavailable': '에피소드 없음',
    'common.episode_list_empty': '에피소드 목록이 아직 없습니다.',
    'common.no_data': '아직 데이터가 없습니다.',
    'common.retry': '다시 시도',
    'common.refreshing': '새로고침 중…',
    'theme.light': '라이트 모드로 전환',
    'theme.dark': '다크 모드로 전환',
    'search.empty_title': '"{keyword}"에 대한 결과 없음',
    'search.empty_sub': '다른 플랫폼이나 키워드를 시도해 보세요.',
    'discover.empty': '이 플랫폼에서 아직 결과가 없습니다.',
    'discover.cat_title': '카테고리',
    'discover.cat_all': '모든 카테고리',
    'discover.cat_shorts_sub': '짧은 드라마',
    'discover.cat_serial_sub': '드라마 시리즈',
    'common.read_more': '더 보기',
    'common.read_less': '접기',
    'common.confirm': '확인',
    'common.delete': '삭제',
    'common.cancel': '취소',
    'common.favorite_added': '"{title}"이(가) 즐겨찾기에 추가되었습니다.',
    'common.favorite_removed': '"{title}"이(가) 즐겨찾기에서 제거되었습니다.',
    'library.clear_confirm': '모든 {label}을(를) 삭제하시겠습니까?',
    'library.clear_success': '{label}이(가) 삭제되었습니다.',
    'library.history_label': '기록',
    'library.favorite_label': '즐겨찾기',
    'library.clear': '지우기',
    'library.continue_watching': '이어보기',
    'detail.loading_episode': '에피소드 로딩 중…',
    'detail.loading_title': '드라마 정보 로딩 중…',
    'detail.loading_synopsis': '잠시만 기다려 주세요.',
    'detail.watch_now': '지금 보기',
    'detail.cast': '출연진',
    'detail.episode_sub': '에피소드를 선택하여 시청하세요.',
    'player.invalid_params': '잘못된 매개변수',
    'player.invalid_hint': '홈에서 다시 열어주세요.',
    'player.video_unavailable': '이 에피소드의 동영상을 사용할 수 없습니다.',
    'player.unsupported': '브라우저가 이 동영상 형식을 지원하지 않습니다.',
    'player.content_error': '콘텐츠를 불러오지 못했습니다.',
    'player.drama_load_error': '드라마를 불러오지 못했습니다.',
    'player.episode_locked': '이 에피소드는 잠겨 있거나 사용할 수 없습니다.',
    'player.episode_unavailable': '이 에피소드는 아직 시청할 수 없습니다.',
    'player.video_load_error': '동영상을 불러오지 못했습니다.',
    'player.video_play_error': '동영상을 재생할 수 없습니다.',
    'player.resume_from': 'Ep {ep} · {time}부터 이어보기.',
    'player.speed': '속도',
    'player.quality': '화질',
    'player.swipe_hint': '스와이프하여 에피소드 변경',
    'home.kicker': '드라마 스트리밍',
    'home.title': 'Dramova',
    'home.sub': '여러 플랫폼의 짧은 드라마를 발견하고, 이어보고, 저장하세요.',
    'discover.kicker': '카탈로그',
    'discover.sub': '모든 플랫폼의 드라마를 찾아보세요.',
    'search.kicker': '검색',
    'search.title': '드라마 찾기',
    'search.sub': '여러 플랫폼의 드라마를 한 곳에서 검색하고 소스별로 필터링하세요.',
    'search.placeholder': '드라마, 제목, 키워드 검색...',
    'search.platform_title': '플랫폼',
    'search.all_platforms': '모든 플랫폼',
    'search.all_platforms_sub': '검색 결과 통합',
    'library.kicker': '컬렉션',
    'library.sub': '최근 시청 및 즐겨찾기를 한 곳에서 관리하세요.',
    'serial.kicker': '시리즈',
    'serial.sub': '검색, 연도 필터, 큐레이션 섹션으로 시리즈를 탐색하세요.',
  });

  Object.assign(I18N.pt, {
    'nav.home': 'Inicio',
    'nav.shorts': 'Shorts',
    'nav.discover': 'Descobrir',
    'nav.serial': 'Series',
    'nav.search': 'Buscar',
    'nav.history': 'Historico',
    'nav.footer': 'Navegacao',
    'footer.description': 'Uma plataforma moderna de streaming de dramas para historias curtas, series selecionadas e favoritos em uma experiencia leve.',
    'footer.features': 'Recursos Principais',
    'footer.feature.platforms': 'Dramas curtos e series em um so lugar',
    'footer.feature.languages': 'Busque titulos entre catalogos',
    'footer.feature.history': 'Continue assistindo e salve favoritos',
    'footer.made_with': 'Feito com Flask.',
    'common.close': 'Fechar',
    'common.choose': 'Escolher',
    'common.clear': 'Limpar',
    'common.reset': 'Redefinir',
    'common.share': 'Compartilhar',
    'common.back_to_top': 'Voltar ao topo',
    'common.copied': 'Link copiado!',
    'common.no_title': 'Sem titulo',
    'common.no_synopsis': 'Ainda nao ha sinopse para este drama.',
    'common.not_found_title': 'Drama nao encontrado',
    'common.back_home_hint': 'Abra novamente pela pagina inicial.',
    'common.info_unavailable': 'Informacao indisponivel',
    'common.detail_load_error': 'Nao foi possivel carregar as informacoes. Tente novamente em breve.',
    'common.episodes_unavailable': 'Episodios indisponiveis',
    'common.episode_list_empty': 'A lista de episodios ainda nao esta disponivel.',
    'common.no_data': 'Sem dados por enquanto.',
    'common.retry': 'Tentar novamente',
    'common.refreshing': 'Atualizando...',
    'theme.light': 'Ativar modo claro',
    'theme.dark': 'Ativar modo escuro',
    'search.empty_title': 'Nenhum resultado para "{keyword}"',
    'search.empty_sub': 'Tente outra plataforma ou altere a palavra-chave.',
    'discover.empty': 'Nenhum resultado desta plataforma.',
    'discover.cat_title': 'Categoria',
    'discover.cat_all': 'Todas as Categorias',
    'discover.cat_shorts_sub': 'Dramas curtos',
    'discover.cat_serial_sub': 'Séries de drama',
    'common.read_more': 'Ler mais',
    'common.read_less': 'Mostrar menos',
    'common.confirm': 'Confirmar',
    'common.delete': 'Excluir',
    'common.cancel': 'Cancelar',
    'common.favorite_added': '"{title}" adicionado aos favoritos.',
    'common.favorite_removed': '"{title}" removido dos favoritos.',
    'library.clear_confirm': 'Excluir todo {label}?',
    'library.clear_success': '{label} limpo.',
    'library.history_label': 'historico',
    'library.favorite_label': 'favoritos',
    'library.clear': 'Limpar',
    'library.continue_watching': 'Continuar assistindo',
    'detail.loading_episode': 'Carregando episodios...',
    'detail.loading_title': 'Carregando informacoes...',
    'detail.loading_synopsis': 'Aguarde um momento.',
    'detail.watch_now': 'Assistir agora',
    'detail.cast': 'Elenco',
    'detail.episode_sub': 'Escolha um episodio para comecar.',
    'player.invalid_params': 'Parametros invalidos',
    'player.invalid_hint': 'Abra novamente pela pagina inicial.',
    'player.video_unavailable': 'Video indisponivel para este episodio.',
    'player.unsupported': 'Seu navegador ainda nao suporta este formato de video.',
    'player.content_error': 'Conteudo nao carregado. Recarregue em breve.',
    'player.drama_load_error': 'Drama nao carregado. Tente novamente em breve.',
    'player.episode_locked': 'Este episodio esta bloqueado ou indisponivel.',
    'player.episode_unavailable': 'Este episodio ainda nao esta disponivel.',
    'player.video_load_error': 'Video nao carregado. Tente selecionar este episodio novamente.',
    'player.video_play_error': 'Video nao pode ser reproduzido. Tente novamente.',
    'player.resume_from': 'Continuado de Ep {ep} · {time}.',
    'player.speed': 'Velocidade',
    'player.quality': 'Qualidade',
    'player.swipe_hint': 'Deslize para trocar episodio',
    'home.kicker': 'Streaming de Drama',
    'home.title': 'Dramova',
    'home.sub': 'Descubra, continue e salve dramas curtos de varias plataformas em uma experiencia leve para assistir todos os dias.',
    'discover.kicker': 'Catalogo',
    'discover.sub': 'Explore dramas em todas as plataformas.',
    'search.kicker': 'Busca',
    'search.title': 'Buscar Dramas',
    'search.sub': 'Pesquise dramas em varias plataformas em um so lugar e filtre por origem quando precisar.',
    'search.placeholder': 'Buscar dramas, titulos, palavras-chave...',
    'search.platform_title': 'Plataforma',
    'search.all_platforms': 'Todas as plataformas',
    'search.all_platforms_sub': 'Combinar resultados',
    'library.kicker': 'Colecao',
    'library.sub': 'Gerencie assistidos recentes e favoritos em um lugar para continuar o proximo episodio com facilidade.',
    'serial.kicker': 'Series',
    'serial.sub': 'Explore series com busca por titulo, filtro por ano e secoes selecionadas.',
  });

  Object.assign(I18N.th, {
    'nav.home': 'หน้าแรก',
    'nav.shorts': 'Shorts',
    'nav.discover': 'สำรวจ',
    'nav.serial': 'ซีรีส์',
    'nav.search': 'ค้นหา',
    'nav.history': 'ประวัติ',
    'nav.footer': 'เมนู',
    'footer.description': 'แพลตฟอร์มสตรีมมิ่งละครสมัยใหม่สำหรับเรื่องสั้น ซีรีส์คัดสรร และรายการโปรดในประสบการณ์ที่เบาสบาย',
    'footer.features': 'ฟีเจอร์หลัก',
    'footer.feature.platforms': 'ละครสั้นและซีรีส์ในที่เดียว',
    'footer.feature.languages': 'ค้นหาชื่อเรื่องจากหลายแคตตาล็อก',
    'footer.feature.history': 'ดูต่อและบันทึกรายการโปรด',
    'footer.made_with': 'สร้างด้วย Flask.',
    'common.close': 'ปิด',
    'common.choose': 'เลือก',
    'common.clear': 'ล้าง',
    'common.reset': 'รีเซ็ต',
    'common.share': 'แชร์',
    'common.back_to_top': 'กลับด้านบน',
    'common.copied': 'คัดลอกลิงก์แล้ว!',
    'common.no_title': 'ไม่มีชื่อ',
    'common.no_synopsis': 'ยังไม่มีเรื่องย่อสำหรับละครเรื่องนี้',
    'common.not_found_title': 'ไม่พบละคร',
    'common.back_home_hint': 'เปิดอีกครั้งจากหน้าแรก',
    'common.info_unavailable': 'ไม่มีข้อมูล',
    'common.detail_load_error': 'โหลดข้อมูลละครไม่สำเร็จ',
    'common.episodes_unavailable': 'ยังไม่มีตอน',
    'common.episode_list_empty': 'รายการตอนยังไม่พร้อม',
    'common.no_data': 'ยังไม่มีข้อมูล',
    'common.retry': 'ลองอีกครั้ง',
    'common.refreshing': 'กำลังรีเฟรช…',
    'theme.light': 'เปลี่ยนเป็นโหมดสว่าง',
    'theme.dark': 'เปลี่ยนเป็นโหมดมืด',
    'search.empty_title': 'ไม่พบผลลัพธ์สำหรับ "{keyword}"',
    'search.empty_sub': 'ลองแพลตฟอร์มอื่นหรือเปลี่ยนคำค้น',
    'discover.empty': 'ยังไม่มีผลลัพธ์จากแพลตฟอร์มนี้',
    'discover.cat_title': 'หมวดหมู่',
    'discover.cat_all': 'ทุกหมวดหมู่',
    'discover.cat_shorts_sub': 'ละครสั้น',
    'discover.cat_serial_sub': 'ละครซีรีส์',
    'common.read_more': 'อ่านเพิ่มเติม',
    'common.read_less': 'แสดงน้อยลง',
    'common.confirm': 'ยืนยัน',
    'common.delete': 'ลบ',
    'common.cancel': 'ยกเลิก',
    'common.favorite_added': 'เพิ่ม "{title}" ในรายการโปรดแล้ว',
    'common.favorite_removed': 'ลบ "{title}" ออกจากรายการโปรดแล้ว',
    'library.clear_confirm': 'ลบ{label}ทั้งหมด?',
    'library.clear_success': 'ล้าง{label}แล้ว',
    'library.history_label': 'ประวัติ',
    'library.favorite_label': 'รายการโปรด',
    'library.clear': 'ล้าง',
    'library.continue_watching': 'ดูต่อ',
    'detail.loading_episode': 'กำลังโหลดตอน…',
    'detail.loading_title': 'กำลังโหลดข้อมูลละคร…',
    'detail.loading_synopsis': 'กรุณารอสักครู่',
    'detail.watch_now': 'ดูเลย',
    'detail.cast': 'นักแสดง',
    'detail.episode_sub': 'เลือกตอนเพื่อเริ่มดู',
    'player.invalid_params': 'พารามิเตอร์ไม่ถูกต้อง',
    'player.invalid_hint': 'เปิดอีกครั้งจากหน้าแรก',
    'player.video_unavailable': 'วิดีโอสำหรับตอนนี้ยังไม่พร้อม',
    'player.unsupported': 'เบราว์เซอร์ของคุณยังไม่รองรับรูปแบบวิดีโอนี้',
    'player.content_error': 'โหลดเนื้อหาไม่สำเร็จ',
    'player.drama_load_error': 'โหลดละครไม่สำเร็จ',
    'player.episode_locked': 'ตอนนี้ถูกล็อกหรือไม่พร้อมใช้งาน',
    'player.episode_unavailable': 'ตอนนี้ยังไม่พร้อมให้ดู',
    'player.video_load_error': 'โหลดวิดีโอไม่สำเร็จ',
    'player.video_play_error': 'ไม่สามารถเล่นวิดีโอได้',
    'player.resume_from': 'ดูต่อจาก Ep {ep} · {time}',
    'player.speed': 'ความเร็ว',
    'player.quality': 'คุณภาพ',
    'player.swipe_hint': 'ปัดเพื่อเปลี่ยนตอน',
    'home.kicker': 'สตรีมมิ่งละคร',
    'home.title': 'Dramova',
    'home.sub': 'ค้นพบ ดูต่อ และบันทึกละครสั้นจากหลายแพลตฟอร์มในประสบการณ์ที่เบาสบาย',
    'discover.kicker': 'แคตตาล็อก',
    'discover.sub': 'ค้นหาละครจากทุกแพลตฟอร์ม',
    'search.kicker': 'ค้นหา',
    'search.title': 'ค้นหาละคร',
    'search.sub': 'ค้นหาละครจากหลายแพลตฟอร์มในที่เดียวและกรองตามแหล่งที่มา',
    'search.placeholder': 'ค้นหาละคร, ชื่อเรื่อง, คำสำคัญ...',
    'search.platform_title': 'แพลตฟอร์ม',
    'search.all_platforms': 'ทุกแพลตฟอร์ม',
    'search.all_platforms_sub': 'รวมผลการค้นหา',
    'library.kicker': 'คอลเลกชัน',
    'library.sub': 'จัดการรายการที่ดูล่าสุดและรายการโปรดในที่เดียว',
    'serial.kicker': 'ซีรีส์',
    'serial.sub': 'สำรวจซีรีส์ด้วยการค้นหา ฟิลเตอร์ปี และส่วนคัดสรร',
  });

  Object.keys(I18N).forEach((code) => {
    Object.assign(I18N[code], {
      'nav.movie': code === 'id' ? 'Movie' : 'Movie',
      'discover.cat_movie_sub': code === 'id' ? 'Film Asia pilihan' : 'Selected Asian movies',
      'movie.search_placeholder': code === 'id' ? 'Cari judul movie...' : 'Search movie titles...',
      'movie.filter_year_all': code === 'id' ? 'Semua Tahun' : 'All Years',
      'movie.trending': code === 'id' ? 'Sedang Trending' : 'Trending Now',
      'movie.trending_sub': code === 'id' ? 'Movie pilihan yang lagi ramai ditonton.' : 'Movies people are watching right now.',
      'movie.new': code === 'id' ? 'Rilis Baru' : 'New Releases',
      'movie.new_sub': code === 'id' ? 'Judul terbaru dari katalog movie.' : 'Fresh titles from the movie catalog.',
      'movie.for_you': code === 'id' ? 'Untuk Kamu' : 'For You',
      'movie.for_you_sub': code === 'id' ? 'Lebih banyak movie untuk ditonton.' : 'More movies to watch.',
      'movie.empty': code === 'id' ? 'Belum ada daftar movie.' : 'No movie list yet.',
      'movie.empty_data': code === 'id' ? 'Belum ada data.' : 'No data yet.',
      'movie.load_error': code === 'id' ? 'Gagal memuat movie.' : 'Failed to load movies.',
      'profile.kicker': code === 'id' ? 'Pengaturan' : 'Settings',
      'profile.title': code === 'id' ? 'Kelola Akun' : 'Account Settings',
      'profile.sub': code === 'id' ? 'Perbarui informasi profil, password, dan foto akun Dramova.' : 'Update your Dramova profile, password, and account photo.',
    });
  });

  const PLATFORMS = [
    { id: 'goodshort', label: 'GoodShort', orientation: 'vertical', type: 'shorts', disabled: true },
    { id: 'dramabite', label: 'DramaBite', orientation: 'vertical', type: 'shorts', disabled: true },
    { id: 'dramabox', label: 'DramaBox', orientation: 'vertical', type: 'shorts', disabled: true },
    { id: 'dramanova', label: 'DramaNova', orientation: 'horizontal', type: 'shorts', disabled: true },
  ];

  const SERIAL_PLATFORMS = [
    { id: 'kdrama', label: 'K-Drama', orientation: 'horizontal', type: 'series' },
    { id: 'cdrama', label: 'C-Drama', orientation: 'horizontal', type: 'series' },
    { id: 'varietyshow', label: 'Variety Show', orientation: 'horizontal', type: 'series' },
    { id: 'jdrama', label: 'J-Drama', orientation: 'horizontal', type: 'series' },
    { id: 'thaidrama', label: 'Thai Drama', orientation: 'horizontal', type: 'series' },
  ];

  const MOVIE_PLATFORMS = [
    { id: 'kmovie', label: 'K-Movie', orientation: 'horizontal', type: 'movie' },
    { id: 'cmovie', label: 'C-Movie', orientation: 'horizontal', type: 'movie' },
    { id: 'jmovie', label: 'J-Movie', orientation: 'horizontal', type: 'movie' },
    { id: 'thaimovie', label: 'Thai Movie', orientation: 'horizontal', type: 'movie' },
  ];

  const Store = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (_) {}
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (_) {}
    },
  };

  function getLang() {
    return Store.get(STORAGE.LANG, 'id') || 'id';
  }
  function setLang(code) {
    Store.set(STORAGE.LANG, code);
    document.documentElement.lang = code;
    applyTranslations();
    document.dispatchEvent(new CustomEvent('lang:changed', { detail: code }));
  }

  function getPlatform() {
    // One-time migration: reset old default 'dramanova' to new default 'goodshort'
    const MIGRATION_KEY = 'dramova.migrated.platform.v2';
    if (!Store.get(MIGRATION_KEY)) {
      const current = Store.get(STORAGE.PLATFORM);
      if (!current || current === 'dramanova') {
        Store.set(STORAGE.PLATFORM, 'goodshort');
      }
      Store.set(MIGRATION_KEY, true);
    }
    const stored = Store.get(STORAGE.PLATFORM, 'goodshort');
    const valid = PLATFORMS.map((p) => p.id);
    return valid.includes(stored) ? stored : 'goodshort';
  }
  function setPlatform(id) {
    Store.set(STORAGE.PLATFORM, id);
    document.dispatchEvent(new CustomEvent('platform:changed', { detail: id }));
  }

  function langFor(platform) {
    const lang = getLang();
    return (LANG_MAP[lang] && LANG_MAP[lang][platform]) || 'id';
  }

  function t(key, vars = null) {
    const lang = getLang();
    let text = (I18N[lang] && I18N[lang][key]) || I18N.id[key] || key;
    if (vars && typeof text === 'string') {
      Object.entries(vars).forEach(([name, value]) => {
        text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), value);
      });
    }
    return text;
  }

  function applyTranslations(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      el.textContent = t(key);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    root.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
    });
  }

  // History (recent watches) and favorites
  function pushHistory(item) {
    const list = Store.get(STORAGE.HISTORY, []) || [];
    const filtered = list.filter((x) => !(x.id === item.id && x.platform === item.platform));
    filtered.unshift({ ...item, ts: Date.now() });
    Store.set(STORAGE.HISTORY, filtered.slice(0, 60));
  }
  function getHistory() { return Store.get(STORAGE.HISTORY, []) || []; }

  function toggleFavorite(item) {
    const list = Store.get(STORAGE.LIBRARY, []) || [];
    const idx = list.findIndex((x) => x.id === item.id && x.platform === item.platform);
    if (idx >= 0) {
      list.splice(idx, 1);
      Store.set(STORAGE.LIBRARY, list);
      return false;
    }
    list.unshift({ ...item, ts: Date.now() });
    Store.set(STORAGE.LIBRARY, list);
    return true;
  }
  function isFavorite(item) {
    const list = Store.get(STORAGE.LIBRARY, []) || [];
    return list.some((x) => x.id === item.id && x.platform === item.platform);
  }
  function getFavorites() { return Store.get(STORAGE.LIBRARY, []) || []; }

  // ── Theme (dark / light) ───────────────────────────────────────
  function getTheme() {
    return Store.get(STORAGE.THEME, 'dark') || 'dark';
  }
  function setTheme(theme) {
    Store.set(STORAGE.THEME, theme);
    applyTheme(theme);
    document.dispatchEvent(new CustomEvent('theme:changed', { detail: theme }));
  }
  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('light', !isDark);
    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = isDark ? '#0f0f0f' : '#f5f5f7';
  }
  function toggleTheme() {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }

  // Init lang on load
  document.documentElement.lang = getLang();
  document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    applyTheme(getTheme());
  });

  const ACTIVE_PLATFORMS = PLATFORMS.filter((p) => !p.disabled);

  function platformType(platformId) {
    if (SERIAL_PLATFORMS.some((p) => p.id === platformId)) return 'series';
    if (MOVIE_PLATFORMS.some((p) => p.id === platformId)) return 'movie';
    return 'shorts';
  }

  function detailUrl(platform, id) {
    const type = platformType(platform);
    return `/${type}/detail/${platform}/${encodeURIComponent(id)}`;
  }

  function watchUrl(platform, id, ep) {
    const type = platformType(platform);
    const base = `/${type}/watch/${platform}/${encodeURIComponent(id)}`;
    return ep ? `${base}?ep=${ep}` : base;
  }

  // ── Smart Recommendations ─────────────────────────────────────
  // Analisis tags/labels dari history & favorites untuk scoring items
  function getUserPreferences() {
    const history = getHistory();
    const favorites = getFavorites();
    const tagScores = {};
    const platformScores = {};

    // Favorites lebih berbobot (x3) daripada history (x1)
    function addTags(item, weight) {
      const tags = [].concat(
        item.tags || [],
        item.labels || [],
        item.labelInfos?.map(function (l) { return l.name || l.label || ''; }) || [],
        item.typeTwoNames || [],
        item.genres ? item.genres.split(',').map(function (g) { return g.trim(); }) : []
      ).filter(Boolean);
      tags.forEach(function (tag) {
        var key = String(tag).toLowerCase().trim();
        if (key) tagScores[key] = (tagScores[key] || 0) + weight;
      });
      if (item.platform) {
        platformScores[item.platform] = (platformScores[item.platform] || 0) + weight;
      }
    }

    favorites.slice(0, 30).forEach(function (it) { addTags(it, 3); });
    history.slice(0, 30).forEach(function (it) { addTags(it, 1); });

    return { tagScores: tagScores, platformScores: platformScores };
  }

  function scoreItem(item, prefs) {
    var score = 0;
    var tags = [].concat(
      item.tags || [],
      item.labels || [],
      item.labelInfos?.map(function (l) { return l.name || l.label || ''; }) || [],
      item.typeTwoNames || [],
      item.genres ? item.genres.split(',').map(function (g) { return g.trim(); }) : []
    ).filter(Boolean);

    tags.forEach(function (tag) {
      var key = String(tag).toLowerCase().trim();
      if (prefs.tagScores[key]) score += prefs.tagScores[key];
    });

    var platform = item.__platform || item.platform || '';
    if (platform && prefs.platformScores[platform]) {
      score += prefs.platformScores[platform] * 0.5;
    }

    return score;
  }

  function sortByRecommendation(items) {
    var prefs = getUserPreferences();
    var hasPrefs = Object.keys(prefs.tagScores).length > 0;
    if (!hasPrefs) return items; // No data yet, return as-is

    return [...items].sort(function (a, b) {
      return scoreItem(b, prefs) - scoreItem(a, prefs);
    });
  }

  window.Dramova = window.Dramova || {};
  Object.assign(window.Dramova, {
    LANGS, PLATFORMS: ACTIVE_PLATFORMS, ALL_PLATFORMS: PLATFORMS, SERIAL_PLATFORMS, MOVIE_PLATFORMS, STORAGE, Store,
    getLang, setLang, getPlatform, setPlatform, langFor,
    t, applyTranslations,
    pushHistory, getHistory,
    toggleFavorite, isFavorite, getFavorites,
    getTheme, setTheme, toggleTheme,
    platformType, detailUrl, watchUrl,
    getUserPreferences, scoreItem, sortByRecommendation,
  });
})();
