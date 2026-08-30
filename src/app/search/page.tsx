import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pencarian",
  robots: {
    index: false,
    follow: true,
  },
};

import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import PageScript from "@/components/PageScript";

export default function SearchPage() {
  return (
    <PageShell>
      <PageHeader kicker="Pencarian" kickerI18n="search.kicker" title="Cari Film & Serial" titleI18n="search.title" subtitle="Temukan film dan serial dari berbagai platform dalam satu pencarian." subtitleI18n="search.sub" subtitleId="searchHint" className="mt-3" />

      <div className="mt-6">
        <div className="flex w-full gap-2">
          <form id="searchForm" autoComplete="off" className="search-input-wrap flex flex-1 items-center gap-2 pl-4 pr-2 transition-all" style={{ borderRadius: "500px", background: "var(--bg-raised)" }}>
            <i data-lucide="search" className="h-4 w-4 shrink-0" style={{ color: "var(--text-secondary)" }}></i>
            <input id="searchInput" type="search" name="q" placeholder="Cari film, serial, judul, kata kunci..." data-i18n-placeholder="search.placeholder" autoFocus className="flex-1 bg-transparent py-3 text-[15px] outline-none" style={{ color: "var(--text-primary)" }} />
            <button type="button" id="clearSearchBtn" hidden aria-label="Hapus pencarian" className="grid h-7 w-7 shrink-0 place-items-center transition active:scale-90" style={{ borderRadius: "50%", background: "var(--bg-hover)", color: "var(--text-secondary)" }}><i data-lucide="x" className="h-3.5 w-3.5"></i></button>
          </form>
          <button id="searchPlatformBtn" aria-label="Pilih platform" className="grid h-11 w-11 shrink-0 place-items-center transition active:scale-90" style={{ borderRadius: "50%", border: "1px solid var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-secondary)" }}><i data-lucide="sliders-horizontal" className="h-4 w-4"></i></button>
        </div>
      </div>

      <div id="searchGrid" className="content-grid mt-7 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"></div>
      <div className="mt-8 flex justify-center">
        <button
          id="loadMoreBtn"
          hidden
          className="rounded-full bg-[var(--bg-raised)] px-6 py-2.5 text-[13px] font-bold tracking-[0.5px] text-[var(--text-primary)] shadow-sm transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-50 hover:bg-[var(--bg-hover)]"
        >
          MUAT LEBIH BANYAK
        </button>
      </div>
      <PageScript id="page-search" src="/js/search.js" />
    </PageShell>
  );
}
