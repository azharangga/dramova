import { Metadata } from "next";
import { getBaseUrl } from "@/lib/site-url";

interface PageParams {
  params: Promise<{
    platform: string;
    id: string[];
  }>;
}

// Fetch helper with caching
async function getMovieDetail(platform: string, idParts: string[]) {
  try {
    const backendUrl = process.env.API_BASE_URL || "http://localhost:7860";
    const movieId = decodeURIComponent(idParts.join("/"));
    const res = await fetch(`${backendUrl}/movie/${platform}/detail?id=${encodeURIComponent(movieId)}`, {
      next: { revalidate: 3600 * 6 },
      headers: { "User-Agent": "Dramova-SEO-Engine" }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.result || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { platform, id } = await params;
  const movie = await getMovieDetail(platform, id);
  const movieId = decodeURIComponent(id.join("/"));
  const detailCanonical = `${getBaseUrl()}/movie/detail/${platform}/${encodeURIComponent(movieId)}`;

  const movieTitle = movie?.title || movie?.bookName;
  if (!movie || !movieTitle) {
    return {
      title: "Putar Movie",
      alternates: { canonical: detailCanonical },
    };
  }

  const title = `Putar Film ${movieTitle} Subtitle Indonesia`;
  const description = `Putar dan tonton film ${movieTitle} subtitle Indonesia gratis dengan pemutar video modern di Dramova.`;
  const poster = movie.poster || movie.cover || "/img/icon.png";

  return {
    title,
    description,
    alternates: {
      canonical: detailCanonical,
    },
    openGraph: {
      title,
      description,
      url: `${getBaseUrl()}/movie/watch/${platform}/${encodeURIComponent(movieId)}`,
      type: "video.movie",
      images: [
        {
          url: poster,
          alt: movie.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [poster],
    },
  };
}

import WatchPageView from "@/components/WatchPageView";

export default function WatchPage() {
  return <WatchPageView />;
}
