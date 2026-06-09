/**
 * Proxy utility — forwards requests from Next.js API routes to the FastAPI backend.
 * This keeps the backend URL server-side only (not exposed to client).
 */

import { NextRequest, NextResponse } from "next/server";
import { sanitizeBackendResponse } from "@/lib/sanitize-backend-response";

const BACKEND_URL = process.env.API_BASE_URL || "http://localhost:7860";

interface ProxyOptions {
  stream?: boolean;
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

  const headers: Record<string, string> = {
    "User-Agent": request.headers.get("user-agent") || "Dramova-Frontend/1.0",
    Accept: request.headers.get("accept") || "application/json",
  };

  // Forward range header for stream proxy
  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    headers["Range"] = rangeHeader;
  }

  try {
    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      cache: options.stream ? "no-store" : "force-cache",
      // No body for GET/HEAD/OPTIONS
    });

    // For streaming responses (video/subtitle proxy), pass through directly
    if (options.stream && response.body) {
      const responseHeaders = new Headers();
      // Forward relevant headers from backend
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
    const data = sanitizeBackendResponse(await response.json(), request.headers.get("user-agent") || "");

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=600, stale-while-revalidate=1800",
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
      { status: 502 }
    );
  }
}
