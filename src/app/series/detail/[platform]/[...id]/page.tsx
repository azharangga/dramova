import { Metadata } from "next";
import { getBaseUrl } from "@/lib/site-url";

interface PageParams {
  params: Promise<{
    platform: string;
    id: string[];
  }>;
}

// Fetch helper with caching
async function getDramaDetail(platform: string, idParts: string[]) {
  try {
    const backendUrl = process.env.API_BASE_URL || "http://localhost:7860";
    const dramaId = decodeURIComponent(idParts.join("/"));
    const res = await fetch(`${backendUrl}/serial/${platform}/detail?id=${encodeURIComponent(dramaId)}`, {
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
  const drama = await getDramaDetail(platform, id);
  const dramaId = decodeURIComponent(id.join("/"));
  const canonicalUrl = `${getBaseUrl()}/series/detail/${platform}/${encodeURIComponent(dramaId)}`;

  const dramaTitle = drama?.title || drama?.bookName;
  if (!drama || !dramaTitle) {
    return {
      title: "Detail Serial",
      alternates: { canonical: canonicalUrl },
    };
  }

  const title = `Nonton ${dramaTitle} Sub Indo Full Episode`;
  const description = `Nonton dan streaming serial ${dramaTitle} (${drama.year || "Terbaru"}) subtitle Indonesia gratis di Dramova. ${drama.synopsis ? drama.synopsis.slice(0, 130) + "..." : "Tonton gratis sekarang."}`;
  const poster = drama.poster || drama.cover || "/img/icon.png";

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
      type: "video.tv_show",
      images: [
        {
          url: poster,
          alt: dramaTitle,
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
  const drama = await getDramaDetail(platform, id);
  const dramaId = decodeURIComponent(id.join("/"));
  const canonicalUrl = `${getBaseUrl()}/series/detail/${platform}/${encodeURIComponent(dramaId)}`;

  const schemaJson = drama ? {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    "name": drama.title,
    "image": drama.poster,
    "description": drama.synopsis,
    "inLanguage": "id",
    "genre": drama.genres || [],
    "actor": drama.casts ? drama.casts.map((c: string) => ({ "@type": "Person", "name": c })) : [],
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
        "name": "Serial",
        "item": `${getBaseUrl()}/series`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": drama?.title || "Detail",
        "item": canonicalUrl
      }
    ]
  };

  return (
    <PageShell>
      {schemaJson && (
        <Script
          id="tvseries-jsonld"
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
        <h1>Nonton {drama?.title || "Serial"} Sub Indo</h1>
        <p>{drama?.synopsis || "Nonton gratis series di Dramova."}</p>
      </div>

      <DetailScaffold />
    </PageShell>
  );
}
