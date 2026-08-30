import { Metadata } from "next";
import { getBaseUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Nonton Movie dan Film Asia Terlengkap Sub Indo",
  description: "Streaming film bioskop dan movie Asia terbaik (K-Movie, C-Movie, J-Movie) subtitle Indonesia dengan resolusi HD dan pemutar cepat di Dramova.",
  alternates: {
    canonical: `${getBaseUrl()}/movie`,
  },
  openGraph: {
    title: "Nonton Movie dan Film Asia Terlengkap Sub Indo | Dramova",
    description: "Streaming film bioskop dan movie Asia terbaik subtitle Indonesia gratis di Dramova.",
    url: `${getBaseUrl()}/movie`,
  },
};

import PageShell from "@/components/PageShell";
import { CatalogSearchControls, CatalogTabs } from "@/components/CatalogControls";
import { MediaGridSection, MediaRailSection } from "@/components/MediaSections";
import PageScript from "@/components/PageScript";
import { HeroSkeleton } from "@/components/Skeletons";

const movieTabs = [
  { id: "kmovie", label: "K-Movie" },
  { id: "cmovie", label: "C-Movie" },
  { id: "jmovie", label: "J-Movie" },
  { id: "thaimovie", label: "Thai Movie" },
];

export default function MoviePage() {
  return (
    <PageShell>
      <HeroSkeleton trackId="movieHeroTrack" dotsId="movieHeroDots" label="Sorotan Movie" />
      <CatalogTabs tabs={movieTabs} label="Kategori Movie" dataAttribute="data-movie-tab" />
      <CatalogSearchControls prefix="movie" placeholder="Cari judul movie..." placeholderI18n="movie.search_placeholder" />
      <MediaRailSection id="movieTrendingSection" railId="movieTrendingRail" title="Sedang Trending" titleI18n="movie.trending" subtitle="Movie pilihan yang lagi ramai ditonton." subtitleI18n="movie.trending_sub" />
      <MediaRailSection id="movieNewSection" railId="movieNewRail" title="Rilis Baru" titleI18n="movie.new" subtitle="Judul terbaru dari katalog movie." subtitleI18n="movie.new_sub" />
      <MediaGridSection id="movieForYouSection" gridId="movieForYouGrid" title="Untuk Kamu" titleI18n="movie.for_you" subtitle="Lebih banyak movie untuk ditonton." subtitleI18n="movie.for_you_sub" />
      <PageScript id="page-movie" src="/js/movie.js" />
    </PageShell>
  );
}
