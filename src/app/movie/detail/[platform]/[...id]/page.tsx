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
      next: { revalidate: 3600 * 6 }, // Cache 6 hours
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
  const canonicalUrl = `${getBaseUrl()}/movie/detail/${platform}/${encodeURIComponent(movieId)}`;

  const movieTitle = movie?.title || movie?.bookName;
  if (!movie || !movieTitle) {
    return {
      title: "Detail Movie",
      alternates: { canonical: canonicalUrl },
    };
  }

  const title = `Nonton ${movieTitle} Sub Indo Full Movie`;
  const description = `Nonton dan streaming film ${movieTitle} (${movie.year || "Terbaru"}) subtitle Indonesia HD gratis di Dramova. ${movie.synopsis ? movie.synopsis.slice(0, 130) + "..." : "Tonton gratis sekarang."}`;
  const poster = movie.poster || movie.cover || "/img/icon.png";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "video.movie",
      images: [
        {
          url: poster,
          alt: movieTitle,
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

import DetailScaffold from "@/components/DetailScaffold";
import PageShell from "@/components/PageShell";
import Script from "next/script";

export default async function DetailPage({ params }: PageParams) {
  const { platform, id } = await params;
  const movie = await getMovieDetail(platform, id);
  const movieId = decodeURIComponent(id.join("/"));
  const canonicalUrl = `${getBaseUrl()}/movie/detail/${platform}/${encodeURIComponent(movieId)}`;

  const schemaJson = movie ? {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": movie.title,
    "image": movie.poster,
    "description": movie.synopsis,
    "inLanguage": "id",
    "genre": movie.genres || [],
    "url": canonicalUrl
  } : null;

  const breadcrumbJson = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Beranda",
        "item": getBaseUrl()
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Movie",
        "item": `${getBaseUrl()}/movie`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": movie?.title || "Detail",
        "item": canonicalUrl
      }
    ]
  };

  return (
    <PageShell>
      {schemaJson && (
        <Script
          id="movie-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
        />
      )}
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
      />
      
      {/* SSR Initial Heading & Meta for SEO */}
      <div className="sr-only">
        <h1>Nonton {movie?.title || "Movie"} Sub Indo</h1>
        <p>{movie?.synopsis || "Nonton gratis film di Dramova."}</p>
      </div>

      <DetailScaffold />
    </PageShell>
  );
}
