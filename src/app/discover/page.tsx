import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import PageScript from "@/components/PageScript";
import { PosterSkeletonList } from "@/components/Skeletons";

export default function DiscoverPage() {
  return (
    <PageShell>
      <PageHeader kicker="Katalog" kickerI18n="discover.kicker" title="Jelajahi" titleI18n="discover.title" subtitle="Telusuri katalog film dan serial lintas platform." subtitleI18n="discover.sub" />

      <div className="mt-6 flex items-center gap-3">
        <div className="search-input-wrap relative flex flex-1 items-center gap-2 rounded-full px-4 py-2.5" style={{ background: "var(--bg-raised)", border: "1px solid var(--border-color)", minHeight: "44px" }}>
          <i data-lucide="search" className="h-4 w-4 shrink-0" style={{ color: "var(--text-tertiary)" }}></i>
          <input id="discoverSearch" type="text" className="w-full bg-transparent text-sm font-medium outline-none" style={{ color: "var(--text-primary)" }} placeholder="Cari film, serial, judul, kata kunci..." data-i18n-placeholder="search.placeholder" />
          <button id="discoverSearchClear" type="button" hidden className="shrink-0 p-0.5" style={{ color: "var(--text-tertiary)" }} aria-label="Hapus"><i data-lucide="x" className="h-4 w-4"></i></button>
        </div>
        <button id="discoverFilterBtn" type="button" className="inline-flex h-11 w-11 shrink-0 items-center justify-center" style={{ borderRadius: "9999px", border: "1px solid var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-secondary)" }} aria-label="Pilih Kategori">
          <i data-lucide="sliders-horizontal" className="h-4 w-4"></i>
        </button>
      </div>

      <section className="section-block !mt-7">
        <PosterSkeletonList id="discoverGrid" kind="grid" count={12} />
        <div className="mt-8 flex justify-center">
          <button id="loadMoreBtn" hidden className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition active:scale-95" style={{ borderRadius: "9999px", border: "1px solid var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-primary)", letterSpacing: "1.4px", textTransform: "uppercase" }}><i data-lucide="chevron-down" className="h-4 w-4"></i><span data-i18n="common.load_more">Muat lebih banyak</span></button>
        </div>
      </section>
      <PageScript id="page-discover" src="/js/discover.js" />
    </PageShell>
  );
}
