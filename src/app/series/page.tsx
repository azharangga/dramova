import Script from "next/script";
import PageShell from "@/components/PageShell";

export default function SeriesPage() {
  return (
    <PageShell>
      <section className="home-hero relative mt-0 overflow-hidden" aria-label="Sorotan Serial" style={{ background: "var(--bg-surface)" }}>
        <div id="serialHeroTrack" className="hero-track-stack relative w-full"><div className="home-hero-skeleton relative block w-full shrink-0 overflow-hidden"><div className="home-hero-skeleton-bg absolute inset-0 skeleton"></div><div className="home-hero-skeleton-shade absolute inset-0"></div><div className="home-hero-skeleton-copy absolute z-[2]"><div className="home-hero-skeleton-badge skeleton"></div><div className="home-hero-skeleton-title home-hero-skeleton-title-a skeleton"></div><div className="home-hero-skeleton-title home-hero-skeleton-title-b skeleton"></div><div className="home-hero-skeleton-meta skeleton"></div><div className="home-hero-skeleton-line home-hero-skeleton-line-a skeleton"></div><div className="home-hero-skeleton-line home-hero-skeleton-line-b skeleton"></div><div className="home-hero-skeleton-cta skeleton"></div></div></div></div>
        <div id="serialHeroDots" className="home-hero-dots absolute inset-x-0 z-10 flex justify-center gap-2"></div>
      </section>

      <div className="serial-search-controls mt-6 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
        <form id="serialSearchForm" autoComplete="off" className="flex h-12 min-w-0 items-center gap-2 px-4 transition" style={{ borderRadius: "9999px", background: "var(--bg-raised)", boxShadow: "var(--inset-border)" }}>
          <i data-lucide="search" className="h-4 w-4 shrink-0" style={{ color: "var(--text-secondary)" }}></i>
          <input id="serialSearchInput" type="search" placeholder="Cari judul serial..." data-i18n-placeholder="serial.search_placeholder" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" style={{ color: "var(--text-primary)" }} />
          <button id="serialSearchClear" type="button" hidden aria-label="Hapus pencarian" className="grid h-8 w-8 shrink-0 place-items-center transition active:scale-90" style={{ borderRadius: "50%", color: "var(--text-secondary)" }}><i data-lucide="x" className="h-4 w-4"></i></button>
        </form>
        <button id="serialYearFilter" type="button" aria-label="Filter tahun" className="grid h-11 w-11 shrink-0 place-items-center transition active:scale-95" style={{ borderRadius: "9999px", border: "1px solid var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-secondary)" }}><i data-lucide="calendar" className="h-4 w-4 shrink-0"></i><span id="serialYearLabel" className="sr-only">Semua Tahun</span></button>
        <button id="serialFilterReset" type="button" hidden aria-label="Reset filter" className="grid h-11 w-11 shrink-0 place-items-center transition active:scale-95" style={{ borderRadius: "9999px", border: "1px solid var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-secondary)" }}><i data-lucide="rotate-ccw" className="h-4 w-4"></i></button>
      </div>

      <section className="section-block carousel-section" id="serialTrendingSection">
        <div className="section-header"><div><h2 className="section-title" data-i18n="serial.trending">Sedang Trending</h2><p className="section-subtitle" data-i18n="serial.trending_sub">Serial pilihan yang lagi ramai ditonton.</p></div></div>
        <div className="carousel-rail-wrap"><div id="serialTrendingRail" className="media-rail no-scrollbar snap-rail grid grid-flow-col auto-cols-[140px] overflow-x-auto sm:auto-cols-[160px]">{Array.from({length:8}).map((_,i)=><div key={i} className="block snap-start"><div className="aspect-[2/3] skeleton" style={{borderRadius:"6px"}}></div><div className="mt-2 h-3 w-full rounded skeleton"></div><div className="mt-1.5 h-2.5 w-3/5 rounded skeleton"></div></div>)}</div></div>
      </section>

      <section className="section-block carousel-section" id="serialNewSection">
        <div className="section-header"><div><h2 className="section-title" data-i18n="serial.new">Rilis Baru</h2><p className="section-subtitle" data-i18n="serial.new_sub">Judul terbaru dari katalog serial.</p></div></div>
        <div className="carousel-rail-wrap"><div id="serialNewRail" className="media-rail no-scrollbar snap-rail grid grid-flow-col auto-cols-[140px] overflow-x-auto sm:auto-cols-[160px]">{Array.from({length:8}).map((_,i)=><div key={i} className="block snap-start"><div className="aspect-[2/3] skeleton" style={{borderRadius:"6px"}}></div><div className="mt-2 h-3 w-full rounded skeleton"></div><div className="mt-1.5 h-2.5 w-3/5 rounded skeleton"></div></div>)}</div></div>
      </section>

      <section className="section-block" id="serialForYouSection">
        <div className="section-header"><div><h2 className="section-title" data-i18n="serial.for_you">Untuk Kamu</h2><p className="section-subtitle" data-i18n="serial.for_you_sub">Lebih banyak serial untuk ditonton.</p></div></div>
        <div id="serialForYouGrid" className="content-grid grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">{Array.from({length:12}).map((_,i)=><div key={i} className="block snap-start"><div className="aspect-[2/3] skeleton" style={{borderRadius:"6px"}}></div><div className="mt-2 h-3 w-full rounded skeleton"></div><div className="mt-1.5 h-2.5 w-3/5 rounded skeleton"></div></div>)}</div>
        <div className="mt-8 flex justify-center"><button id="loadMoreBtn" hidden className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition active:scale-95" style={{ borderRadius: "9999px", border: "1px solid var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-primary)", letterSpacing: "1.4px", textTransform: "uppercase" }}><i data-lucide="chevron-down" className="h-4 w-4"></i><span data-i18n="common.load_more">Muat lebih banyak</span></button></div>
      </section>
      <Script id="page-serial" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
        function _load(){var s=document.createElement('script');s.src='/js/serial.js';document.body.appendChild(s);}
        if(window.__DRAMOVA_READY)_load();else document.addEventListener('dramova:ready',_load,{once:true});
      `}} />
    </PageShell>
  );
}
