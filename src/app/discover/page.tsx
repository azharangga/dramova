import { Metadata } from "next";
import { getBaseUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Jelajahi dan Cari Drama, Movie, serta Serial Favorit",
  description: "Temukan drama Korea, drama China, film Asia, dan berbagai genre favorit Anda dari seluruh platform dengan mudah dan cepat di Dramova.",
  alternates: {
    canonical: `${getBaseUrl()}/discover`,
  },
  openGraph: {
    title: "Jelajahi dan Cari Drama, Movie, serta Serial Favorit | Dramova",
    description: "Temukan film dan serial terbaik pilihan Anda di Dramova.",
    url: `${getBaseUrl()}/discover`,
  },
};

import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import PageScript from "@/components/PageScript";
import { PosterSkeletonList } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DiscoverPage() {
  return (
    <PageShell>
      <PageHeader kicker="Katalog" kickerI18n="discover.kicker" title="Jelajahi" titleI18n="discover.title" subtitle="Telusuri katalog film dan serial lintas platform." subtitleI18n="discover.sub" />

      <div className="mt-6 flex items-center gap-3">
        <div className="search-input-wrap relative flex flex-1 items-center gap-2 rounded-full px-4 py-2.5" style={{ background: "var(--bg-raised)", border: "1px solid var(--border-color)", minHeight: "44px" }}>
          <i data-lucide="search" className="h-4 w-4 shrink-0" style={{ color: "var(--text-tertiary)" }}></i>
          <Input id="discoverSearch" type="text" className="h-auto w-full border-0 bg-transparent px-0 py-0 text-sm font-medium shadow-none focus-visible:ring-0" style={{ color: "var(--text-primary)" }} placeholder="Cari film, serial, judul, kata kunci..." data-i18n-placeholder="search.placeholder" />
          <Button id="discoverSearchClear" type="button" hidden variant="ghost" size="icon-sm" className="shrink-0" aria-label="Hapus"><i data-lucide="x" className="h-4 w-4"></i></Button>
        </div>
        <Button id="discoverFilterBtn" type="button" variant="outline" size="icon-lg" className="shrink-0" aria-label="Pilih Kategori">
          <i data-lucide="sliders-horizontal" className="h-4 w-4"></i>
        </Button>
      </div>

      <section className="section-block !mt-7">
        <PosterSkeletonList id="discoverGrid" kind="grid" count={12} />
        <div className="mt-8 flex justify-center">
          <Button id="loadMoreBtn" hidden variant="outline" size="lg" className="uppercase tracking-[1.4px]"><i data-lucide="chevron-down" className="h-4 w-4"></i><span data-i18n="common.load_more">Muat lebih banyak</span></Button>
        </div>
      </section>
      <PageScript id="page-discover" src="/js/discover.js" />
    </PageShell>
  );
}
