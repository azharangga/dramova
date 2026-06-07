import PageShell from "@/components/PageShell";
import PageScript from "@/components/PageScript";
import { MediaGridSection, MediaRailSection } from "@/components/MediaSections";
import { HeroSkeleton } from "@/components/Skeletons";

export default function HomePage() {
  return (
    <PageShell>
      <HeroSkeleton trackId="heroTrack" dotsId="heroDots" label="Sorotan" />
      <MediaRailSection
        id="trendingSection"
        railId="trendingRail"
        title="Sedang Trending"
        titleI18n="home.trending"
        subtitle="Konten paling banyak ditonton sekarang."
        subtitleI18n="home.trending_sub"
        action={
          <button id="homeCategoryBtn" type="button" aria-label="Pilih Kategori" className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 p-0 text-xs font-bold transition hover:opacity-80 active:scale-95 sm:h-auto sm:w-auto sm:px-4 sm:py-2" style={{ borderRadius: "9999px", border: "1px solid var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-secondary)", letterSpacing: "1.2px", textTransform: "uppercase" }}><i data-lucide="sliders-horizontal" className="h-3.5 w-3.5"></i><span id="homeCategoryLabel" className="hidden sm:inline">Kategori</span><i data-lucide="chevron-down" className="hidden h-3.5 w-3.5 sm:block"></i></button>
        }
      />
      <MediaRailSection id="newReleaseSection" railId="newReleaseRail" title="Rilis Baru" titleI18n="home.new" subtitle="Film dan serial segar yang baru ditambahkan." subtitleI18n="home.new_sub" />
      <MediaGridSection id="forYouSection" gridId="forYouGrid" title="Untuk Kamu" titleI18n="home.for_you" subtitle="Pilihan terkurasi dari semua platform." subtitleI18n="home.for_you_sub" loadMoreMinHeight />
      <PageScript id="page-index" src="/js/index.js" />
    </PageShell>
  );
}
