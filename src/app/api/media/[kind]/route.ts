import { NextRequest, NextResponse } from "next/server";
import { mediaPath, readMediaToken } from "@/lib/secure-media";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_KINDS = new Set(["image", "stream", "subtitle"]);
const FORWARD_REQUEST_HEADERS = ["range", "if-range", "if-none-match", "if-modified-since"];
const FORWARD_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified",
];

function isDirectNavigation(request: NextRequest) {
  const mode = request.headers.get("sec-fetch-mode");
  const dest = request.headers.get("sec-fetch-dest");
  return mode === "navigate" || dest === "document";
}

function upstreamHeaders(request: NextRequest) {
  const headers: Record<string, string> = {
    "User-Agent": request.headers.get("user-agent") || "Dramova-Frontend/1.0",
    Accept: request.headers.get("accept") || "*/*",
    "Accept-Encoding": "identity",
  };

  FORWARD_REQUEST_HEADERS.forEach((header) => {
    const value = request.headers.get(header);
    if (value) headers[header] = value;
  });

  return headers;
}

function copyResponseHeaders(upstream: Response, kind: "image" | "stream" | "subtitle") {
  const responseHeaders = new Headers();
  FORWARD_RESPONSE_HEADERS.forEach((header) => {
    const value = upstream.headers.get(header);
    if (value) responseHeaders.set(header, value);
  });
  responseHeaders.set("Cache-Control", kind === "image" ? "public, max-age=3600, s-maxage=86400" : "no-store, no-transform");
  responseHeaders.set("X-Accel-Buffering", "no");
  return responseHeaders;
}

function rewritePlaylistLine(line: string, baseUrl: string, userAgent: string) {
  const trimmed = line.trim();
  if (!trimmed) return line;

  if (trimmed.startsWith("#")) {
    return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
      const absolute = new URL(uri, baseUrl).toString();
      return `URI="${mediaPath("stream", absolute, userAgent)}"`;
    });
  }

  const absolute = new URL(trimmed, baseUrl).toString();
  return mediaPath("stream", absolute, userAgent);
}

async function fetchWithRetry(url: string, init: RequestInit, maxRetries = 2): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      lastError = err as Error;
      const msg = lastError?.message || "";
      // Only retry on DNS resolution failures
      const isDnsError = msg.includes("ENOTFOUND") || msg.includes("getaddrinfo");
      if (!isDnsError || attempt >= maxRetries) throw lastError;
      // Brief wait before retry
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastError || new Error("Fetch failed");
}

async function handleMedia(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string }> },
  method: "GET" | "HEAD",
) {
  const { kind } = await params;
  if (!ALLOWED_KINDS.has(kind)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const mediaKind = kind as "image" | "stream" | "subtitle";
  if (isDirectNavigation(request)) return NextResponse.json({ error: "Media endpoint tidak bisa dibuka langsung" }, { status: 403 });

  const userAgent = request.headers.get("user-agent") || "";
  const url = readMediaToken(request.nextUrl.searchParams.get("token") || "", mediaKind, userAgent);
  if (!url) return NextResponse.json({ error: "Invalid media token" }, { status: 403 });

  const upstream = await fetchWithRetry(url, {
    method,
    headers: upstreamHeaders(request),
    cache: mediaKind === "image" ? "force-cache" : "no-store",
    signal: request.signal,
  });
  const responseHeaders = copyResponseHeaders(upstream, mediaKind);
  if (method === "HEAD") return new Response(null, { status: upstream.status, headers: responseHeaders });

  const contentType = upstream.headers.get("content-type") || "";
  if (mediaKind === "stream" && (/mpegurl|m3u8/i.test(contentType) || /\.m3u8(\?|$)/i.test(url))) {
    const playlist = await upstream.text();
    const rewritten = playlist.split("\n").map((line) => rewritePlaylistLine(line, url, userAgent)).join("\n");
    responseHeaders.delete("content-length");
    return new Response(rewritten, { status: upstream.status, headers: responseHeaders });
  }

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kind: string }> },
) {
  return handleMedia(request, context, "GET");
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ kind: string }> },
) {
  return handleMedia(request, context, "HEAD");
}
