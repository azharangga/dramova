import PageShell from "@/components/PageShell";
import { CatalogSearchControls, CatalogTabs } from "@/components/CatalogControls";
import { MediaGridSection, MediaRailSection } from "@/components/MediaSections";
import PageScript from "@/components/PageScript";
import { HeroSkeleton } from "@/components/Skeletons";

const serialTabs = [
  { id: "kdrama", label: "K-Drama" },
  { id: "cdrama", label: "C-Drama" },
  { id: "varietyshow", label: "Variety Show" },
  { id: "jdrama", label: "J-Drama" },
  { id: "thaidrama", label: "Thai Drama" },
];

export default function SeriesPage() {
  return (
    <PageShell>
      <HeroSkeleton trackId="serialHeroTrack" dotsId="serialHeroDots" label="Sorotan Serial" />
      <CatalogTabs tabs={serialTabs} label="Kategori Serial" dataAttribute="data-serial-tab" idPrefix="serialTab" />
      <CatalogSearchControls prefix="serial" placeholder="Cari judul serial..." placeholderI18n="serial.search_placeholder" />
      <MediaRailSection id="serialTrendingSection" railId="serialTrendingRail" title="Sedang Trending" titleI18n="serial.trending" subtitle="Serial pilihan yang lagi ramai ditonton." subtitleI18n="serial.trending_sub" />
      <MediaRailSection id="serialNewSection" railId="serialNewRail" title="Rilis Baru" titleI18n="serial.new" subtitle="Judul terbaru dari katalog serial." subtitleI18n="serial.new_sub" />
      <MediaGridSection id="serialForYouSection" gridId="serialForYouGrid" title="Untuk Kamu" titleI18n="serial.for_you" subtitle="Lebih banyak serial untuk ditonton." subtitleI18n="serial.for_you_sub" />
      <PageScript id="page-serial" src="/js/serial.js" />
    </PageShell>
  );
}
