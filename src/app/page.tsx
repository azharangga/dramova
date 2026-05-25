import Script from "next/script";
import PageShell from "@/components/PageShell";

export default function HomePage() {
  return (
    <PageShell>
      <section className="home-hero relative mt-0 overflow-hidden" aria-label="Sorotan" style={{ background: "var(--bg-surface)" }}>
        <div id="heroTrack" className="hero-track-stack relative w-full"><div className="home-hero-skeleton relative block w-full shrink-0 overflow-hidden"><div className="home-hero-skeleton-bg absolute inset-0 skeleton"></div><div className="home-hero-skeleton-shade absolute inset-0"></div><div className="home-hero-skeleton-copy absolute z-[2]"><div className="home-hero-skeleton-badge skeleton"></div><div className="home-hero-skeleton-title home-hero-skeleton-title-a skeleton"></div><div className="home-hero-skeleton-title home-hero-skeleton-title-b skeleton"></div><div className="home-hero-skeleton-meta skeleton"></div><div className="home-hero-skeleton-line home-hero-skeleton-line-a skeleton"></div><div className="home-hero-skeleton-line home-hero-skeleton-line-b skeleton"></div><div className="home-hero-skeleton-cta skeleton"></div></div></div></div>
        <div id="heroDots" className="home-hero-dots absolute inset-x-0 z-10 flex justify-center gap-2"></div>
      </section>
      <section className="section-block carousel-section" id="trendingSection">
        <div className="section-header"><div><h2 className="section-title" data-i18n="home.trending">Sedang Trending</h2><p className="section-subtitle" data-i18n="home.trending_sub">Konten paling banyak ditonton sekarang.</p></div>
          <button id="homeCategoryBtn" type="button" aria-label="Pilih Kategori" className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 p-0 text-xs font-bold transition hover:opacity-80 active:scale-95 sm:h-auto sm:w-auto sm:px-4 sm:py-2" style={{ borderRadius: "9999px", border: "1px solid var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-secondary)", letterSpacing: "1.2px", textTransform: "uppercase" }}><i data-lucide="sliders-horizontal" className="h-3.5 w-3.5"></i><span id="homeCategoryLabel" className="hidden sm:inline">Kategori</span><i data-lucide="chevron-down" className="hidden h-3.5 w-3.5 sm:block"></i></button>
        </div>
        <div className="carousel-rail-wrap"><div id="trendingRail" className="media-rail no-scrollbar snap-rail grid grid-flow-col auto-cols-[140px] overflow-x-auto sm:auto-cols-[160px]">{Array.from({length:8}).map((_,i)=><div key={i} className="block snap-start"><div className="aspect-[2/3] skeleton" style={{borderRadius:"6px"}}></div><div className="mt-2 h-3 w-full rounded skeleton"></div><div className="mt-1.5 h-2.5 w-3/5 rounded skeleton"></div></div>)}</div></div>
      </section>
      <section className="section-block carousel-section" id="newReleaseSection">
        <div className="section-header"><div><h2 className="section-title" data-i18n="home.new">Rilis Baru</h2><p className="section-subtitle" data-i18n="home.new_sub">Drama segar yang baru ditambahkan.</p></div></div>
        <div className="carousel-rail-wrap"><div id="newReleaseRail" className="media-rail no-scrollbar snap-rail grid grid-flow-col auto-cols-[140px] overflow-x-auto sm:auto-cols-[160px]">{Array.from({length:8}).map((_,i)=><div key={i} className="block snap-start"><div className="aspect-[2/3] skeleton" style={{borderRadius:"6px"}}></div><div className="mt-2 h-3 w-full rounded skeleton"></div><div className="mt-1.5 h-2.5 w-3/5 rounded skeleton"></div></div>)}</div></div>
      </section>
      <section className="section-block" id="forYouSection">
        <div className="section-header"><div><h2 className="section-title" data-i18n="home.for_you">Untuk Kamu</h2><p className="section-subtitle" data-i18n="home.for_you_sub">Pilihan terkurasi dari semua platform.</p></div></div>
        <div id="forYouGrid" className="content-grid grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">{Array.from({length:12}).map((_,i)=><div key={i} className="block snap-start"><div className="aspect-[2/3] skeleton" style={{borderRadius:"6px"}}></div><div className="mt-2 h-3 w-full rounded skeleton"></div><div className="mt-1.5 h-2.5 w-3/5 rounded skeleton"></div></div>)}</div>
        <div className="mt-8 flex justify-center"><button id="loadMoreBtn" hidden className="inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition hover:opacity-90 active:scale-95" style={{ borderRadius: "9999px", border: "1px solid var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-primary)", letterSpacing: "1.4px", textTransform: "uppercase" }}><i data-lucide="chevron-down" className="h-4 w-4"></i><span data-i18n="common.load_more">Muat lebih banyak</span></button></div>
      </section>
      <Script id="page-index" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
        function _load(){var s=document.createElement('script');s.src='/js/index.js';document.body.appendChild(s);}
        if(window.__DRAMOVA_READY)_load();else document.addEventListener('dramova:ready',_load,{once:true});
      `}} />
    </PageShell>
  );
}
