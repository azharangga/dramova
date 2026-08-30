import { MetadataRoute } from "next";
import { getBaseUrl, absoluteUrl } from "@/lib/site-url";

export const revalidate = 86400; // Revalidate sitemap every 24 hours

// List of available platforms on the backend for catalog fetching
const PLATFORMS = ["dramanova", "nonton", "yydrama", "fmdrama", "dramacool"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const routes: MetadataRoute.Sitemap = [];

  // 1. Static & Core Hub Pages
  routes.push({
    url: absoluteUrl("/"),
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  });
  routes.push({
    url: absoluteUrl("/series"),
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  });
  routes.push({
    url: absoluteUrl("/movie"),
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  });
  routes.push({
    url: absoluteUrl("/discover"),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  });

  // Fetch dynamic content to build sitemap URLs (Trending/New)
  // Limited to a safe number so it doesn't timeout Vercel Function (max 10-15s)
  try {
    const backendUrl = process.env.API_BASE_URL || "http://localhost:7860";
    
    // Helper to fetch list and safely parse
    const fetchList = async (path: string) => {
      try {
        const res = await fetch(`${backendUrl}${path}`, {
          next: { revalidate: 3600 * 12 }, // Cache 12 hours
          headers: { "User-Agent": "Dramova-Sitemap-Generator" },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json.result?.items) ? json.result.items : [];
      } catch {
        return [];
      }
    };

    // We'll just fetch a few main catalogs (Trending) for the sitemap to prevent huge payloads
    // Focus on primary platform (dramanova) for base indexing
    const mainPlatform = "dramanova";
    
    const [seriesTrending, movieTrending] = await Promise.all([
      fetchList(`/serial/${mainPlatform}/trending`),
      fetchList(`/movie/${mainPlatform}/trending`)
    ]);

    // Process Series
    for (const item of seriesTrending) {
      if (!item.id) continue;
      routes.push({
        url: absoluteUrl(`/series/detail/${mainPlatform}/${encodeURIComponent(item.id)}`),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    // Process Movies
    for (const item of movieTrending) {
      if (!item.id) continue;
      routes.push({
        url: absoluteUrl(`/movie/detail/${mainPlatform}/${encodeURIComponent(item.id)}`),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

  } catch (error) {
    console.error("Failed to generate dynamic sitemap entries:", error);
  }

  return routes;
}
