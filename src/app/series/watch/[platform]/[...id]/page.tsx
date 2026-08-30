import { Metadata } from "next";
import { getBaseUrl } from "@/lib/site-url";

interface PageParams {
  params: Promise<{
    platform: string;
    id: string[];
  }>;
  searchParams: Promise<{
    ep?: string;
  }>;
}

// Fetch helper with caching
async function getDramaDetail(platform: string, idParts: string[]) {
  try {
    const backendUrl = process.env.API_BASE_URL || "http://localhost:7860";
    const dramaId = decodeURIComponent(idParts.join("/"));
    const res = await fetch(`${backendUrl}/serial/${platform}/detail?id=${encodeURIComponent(dramaId)}`, {
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

export async function generateMetadata({ params, searchParams }: PageParams): Promise<Metadata> {
  const { platform, id } = await params;
  const { ep } = await searchParams;
  const drama = await getDramaDetail(platform, id);
  const dramaId = decodeURIComponent(id.join("/"));
  const episodeNumber = ep || "1";
  
  const detailCanonical = `${getBaseUrl()}/series/detail/${platform}/${encodeURIComponent(dramaId)}`;
  const dramaTitle = drama?.title || drama?.bookName;

  if (!drama || !dramaTitle) {
    return {
      title: `Nonton Serial Episode ${episodeNumber}`,
      alternates: { canonical: detailCanonical },
    };
  }

  const title = `Nonton ${dramaTitle} Episode ${episodeNumber} Subtitle Indonesia`;
  const description = `Streaming serial ${dramaTitle} episode ${episodeNumber} subtitle Indonesia dengan kualitas jernih dan lancar di Dramova.`;
  const poster = drama.poster || drama.cover || "/img/icon.png";

  return {
    title,
    description,
    alternates: {
      canonical: detailCanonical,
    },
    openGraph: {
      title,
      description,
      url: `${getBaseUrl()}/series/watch/${platform}/${encodeURIComponent(dramaId)}?ep=${episodeNumber}`,
      type: "video.episode",
      images: [
        {
          url: poster,
          alt: `${drama.title} Episode ${episodeNumber}`,
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
