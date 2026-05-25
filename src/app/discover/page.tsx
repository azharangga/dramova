import Script from "next/script";
import PageShell from "@/components/PageShell";

export default function DiscoverPage() {
  return (
    <PageShell>
      <div className="page-header">
        <p className="page-kicker" data-i18n="discover.kicker">Katalog</p>
        <h1 className="page-title" data-i18n="discover.title">Jelajahi</h1>
        <p className="page-subtitle" data-i18n="discover.sub">Telusuri katalog drama lintas platform.</p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="search-input-wrap relative flex flex-1 items-center gap-2 rounded-full px-4 py-2.5" style={{ background: "var(--bg-raised)", border: "1px solid var(--border-color)", minHeight: "44px" }}>
          <i data-lucide="search" className="h-4 w-4 shrink-0" style={{ color: "var(--text-tertiary)" }}></i>
          <input id="discoverSearch" type="text" className="w-full bg-transparent text-sm font-medium outline-none" style={{ color: "var(--text-primary)" }} placeholder="Cari drama, judul, kata kunci..." data-i18n-placeholder="search.placeholder" />
          <button id="discoverSearchClear" type="button" hidden className="shrink-0 p-0.5" style={{ color: "var(--text-tertiary)" }} aria-label="Hapus"><i data-lucide="x" className="h-4 w-4"></i></button>
        </div>
        <button id="discoverFilterBtn" type="button" className="inline-flex h-11 w-11 shrink-0 items-center justify-center" style={{ borderRadius: "9999px", border: "1px solid var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-secondary)" }} aria-label="Pilih Kategori">
          <i data-lucide="sliders-horizontal" className="h-4 w-4"></i>
        </button>
      </div>

      <section className="section-block !mt-7">
        <div id="discoverGrid" className="content-grid grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">{Array.from({length:12}).map((_,i)=><div key={i} className="block snap-start"><div className="aspect-[2/3] skeleton" style={{borderRadius:"6px"}}></div><div className="mt-2 h-3 w-full rounded skeleton"></div><div className="mt-1.5 h-2.5 w-3/5 rounded skeleton"></div></div>)}</div>
        <div className="mt-8 flex justify-center">
          <button id="loadMoreBtn" hidden className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition active:scale-95" style={{ borderRadius: "9999px", border: "1px solid var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-primary)", letterSpacing: "1.4px", textTransform: "uppercase" }}><i data-lucide="chevron-down" className="h-4 w-4"></i><span data-i18n="common.load_more">Muat lebih banyak</span></button>
        </div>
      </section>
      <Script id="page-discover" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
        function _load(){var s=document.createElement('script');s.src='/js/discover.js';document.body.appendChild(s);}
        if(window.__DRAMOVA_READY)_load();else document.addEventListener('dramova:ready',_load,{once:true});
      `}} />
    </PageShell>
  );
}
