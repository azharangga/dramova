/**
 * Proxy utility — forwards requests from Next.js API routes to the FastAPI backend.
 * This keeps the backend URL server-side only (not exposed to client).
 */

import { NextRequest, NextResponse } from "next/server";
import { sanitizeBackendResponse } from "@/lib/sanitize-backend-response";

const BACKEND_URL = process.env.API_BASE_URL || "http://localhost:7860";

// Realistic User-Agents agar upstream scraper di backend tidak terblokir
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
];

function pickUserAgent(requestUA: string | null): string {
  // Pakai UA browser asli jika ada & bukan custom UA dari server
  if (requestUA && requestUA.length > 20 && !requestUA.toLowerCase().startsWith("dramova")) {
    return requestUA;
  }
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function isEmptyResult(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (d.status === true) {
    const result = d.result as Record<string, unknown> | undefined;
    if (result && Array.isArray(result.items) && result.items.length === 0) {
      return true;
    }
  }
  return false;
}

interface ProxyOptions {
  stream?: boolean;
  retries?: number;
}

async function fetchWithRetry(
  url: string,
  fetchInit: RequestInit,
  maxRetries = 2,
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchInit);
      return response;
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        // Exponential backoff: 500ms → 1500ms
        await new Promise((r) => setTimeout(r, 500 * Math.pow(3, attempt)));
      }
    }
  }
  throw lastError || new Error("Fetch failed after retries");
}

export async function proxyToBackend(
  request: NextRequest,
  backendPath: string,
  options: ProxyOptions = {}
): Promise<NextResponse | Response> {
  const url = new URL(backendPath, BACKEND_URL);

  // Forward query parameters
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const userAgent = pickUserAgent(request.headers.get("user-agent"));
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "";

  const headers: Record<string, string> = {
    "User-Agent": userAgent,
    Accept: "application/json, */*;q=0.9",
    "Accept-Language": "id,en-US;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };

  // Teruskan IP client agar backend bisa log dengan benar
  if (clientIp) headers["X-Forwarded-For"] = clientIp;

  // Forward range header for stream proxy
  const rangeHeader = request.headers.get("range");
  if (rangeHeader) headers["Range"] = rangeHeader;

  const maxRetries = options.retries ?? (options.stream ? 0 : 2);

  try {
    const response = await fetchWithRetry(
      url.toString(),
      {
        method: request.method,
        headers,
        cache: "no-store",
      },
      maxRetries,
    );

    // For streaming responses (video/subtitle proxy), pass through directly
    if (options.stream && response.body) {
      const responseHeaders = new Headers();
      const forwardHeaders = [
        "content-type",
        "content-length",
        "content-range",
        "accept-ranges",
        "cache-control",
        "access-control-allow-origin",
        "access-control-allow-headers",
        "access-control-allow-methods",
        "access-control-expose-headers",
      ];
      forwardHeaders.forEach((h) => {
        const val = response.headers.get(h);
        if (val) responseHeaders.set(h, val);
      });

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    // For JSON API responses
    const raw = await response.json();
    const data = sanitizeBackendResponse(raw, userAgent);

    // Jika hasil kosong: set stale-if-error tinggi agar CDN Vercel tetap sajikan cache lama
    const isEmpty = isEmptyResult(raw);
    const cacheControl = isEmpty
      ? "public, max-age=0, s-maxage=0, stale-while-revalidate=86400, stale-if-error=604800"
      : "public, max-age=120, s-maxage=900, stale-while-revalidate=3600, stale-if-error=86400";

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": cacheControl,
        "X-Content-Empty": isEmpty ? "1" : "0",
      },
    });
  } catch (error) {
    console.error(`[Proxy] Error fetching ${url.toString()}:`, error);
    return NextResponse.json(
      {
        creator: "Azharangga Kusuma",
        status: false,
        code: 502,
        message: "Backend tidak dapat dihubungi",
        error: String(error),
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
