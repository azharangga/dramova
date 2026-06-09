import { mediaPath } from "@/lib/secure-media";

const DROP_KEYS = new Set([
  "rawUrl",
  "directUrl",
  "httpsUrl",
  "proxiedUrl",
  "proxiedVideoUrl",
  "rawVideoUrl",
  "sourceUrl",
  "source",
  "origin",
  "headers",
  "cookies",
  "request",
  "debug",
]);

const VIDEO_KEYS = new Set(["videoUrl", "url", "playUrl", "streamUrl", "m3u8", "mp4"]);
const IMAGE_KEYS = new Set(["poster", "cover", "coverWap", "image", "detailCover", "thumbnail", "thumb", "verticalCover", "banner", "avatar", "avatarUrl"]);
const SUBTITLE_KEYS = new Set(["subtitle", "subtitleUrl", "subtitles", "vtt", "srt"]);

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function isVideoUrl(url: string) {
  return /\.(m3u8|mp4|m4v|mov)(\?|$)/i.test(url) || /\/(video|stream|play|files?)\//i.test(url);
}

function isImageUrl(url: string) {
  return /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url) || /\/(image|img|poster|cover|avatar)s?\//i.test(url);
}

function isSubtitleUrl(url: string) {
  return /\.(vtt|srt|ass)(\?|$)/i.test(url) || /subtitle|caption/i.test(url);
}

function protectUrl(key: string, value: string, userAgent: string) {
  if (value.startsWith("/proxy/stream") || value.startsWith("/api/proxy/stream") || value.startsWith("/api/media/stream")) {
    try {
      const parsed = new URL(value, "http://internal.local");
      const target = parsed.searchParams.get("url");
      if (target && /^https?:\/\//i.test(target)) return mediaPath("stream", target, userAgent);
    } catch {}
  }
  if (value.startsWith("/proxy/subtitle") || value.startsWith("/api/media/subtitle")) {
    try {
      const parsed = new URL(value, "http://internal.local");
      const target = parsed.searchParams.get("url");
      if (target && /^https?:\/\//i.test(target)) return mediaPath("subtitle", target, userAgent);
    } catch {}
  }
  if (isSubtitleUrl(value) || SUBTITLE_KEYS.has(key)) return mediaPath("subtitle", value, userAgent);
  if (isImageUrl(value) || IMAGE_KEYS.has(key)) return mediaPath("image", value, userAgent);
  if (isVideoUrl(value) || VIDEO_KEYS.has(key)) return mediaPath("stream", value, userAgent);
  return value;
}

function sanitizeValue(value: unknown, key = "", userAgent = ""): unknown {
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, key, userAgent));
  if (typeof value === "string" && value.startsWith("/proxy/")) return protectUrl(key, value, userAgent);
  if (isHttpUrl(value)) return protectUrl(key, value, userAgent);
  if (!value || typeof value !== "object") return value;

  const out: Record<string, unknown> = {};
  Object.entries(value).forEach(([entryKey, entryValue]) => {
    if (DROP_KEYS.has(entryKey)) return;
    out[entryKey] = sanitizeValue(entryValue, entryKey, userAgent);
  });
  return out;
}

export function sanitizeBackendResponse(data: unknown, userAgent = "") {
  return sanitizeValue(data, "", userAgent);
}
