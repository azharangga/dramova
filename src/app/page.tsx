import { Metadata } from "next";
import { getBaseUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Dramova · Nonton Movie dan Serial Drama Subtitle Indonesia",
  description: "Platform streaming modern untuk menikmati berbagai cerita menarik, mulai dari movie hingga serial favorit, dalam pengalaman menonton yang nyaman, ringan, dan immersive.",
  alternates: {
    canonical: `${getBaseUrl()}`,
  },
};

import PageShell from "@/components/PageShell";
import PageScript from "@/components/PageScript";
import { MediaGridSection, MediaRailSection } from "@/components/MediaSections";
import { HeroSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";

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
          <Button id="homeCategoryBtn" type="button" aria-label="Pilih Kategori" variant="outline" className="h-10 w-10 p-0 text-xs uppercase tracking-[1.2px] sm:w-auto sm:px-4"><i data-lucide="sliders-horizontal" className="h-3.5 w-3.5"></i><span id="homeCategoryLabel" className="hidden sm:inline">Kategori</span><i data-lucide="chevron-down" className="hidden h-3.5 w-3.5 sm:block"></i></Button>
        }
      />
      <MediaRailSection id="newReleaseSection" railId="newReleaseRail" title="Rilis Baru" titleI18n="home.new" subtitle="Film dan serial segar yang baru ditambahkan." subtitleI18n="home.new_sub" />
      <MediaGridSection id="forYouSection" gridId="forYouGrid" title="Untuk Kamu" titleI18n="home.for_you" subtitle="Pilihan terkurasi dari semua platform." subtitleI18n="home.for_you_sub" loadMoreMinHeight />
      <PageScript id="page-index" src="/js/index.js" />
    </PageShell>
  );
}
