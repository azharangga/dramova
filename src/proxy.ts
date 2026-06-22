import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Domain migration rewrite layer.
 * When the app is served from the legacy Vercel domain, every navigable route
 * is internally rewritten to the /domain-moved migration page so the user sees
 * a consistent migration notice without the URL bar changing.
 *
 * The rewrite is skipped for:
 *  - The /domain-moved page itself (prevents infinite rewrite loop)
 *  - Public static asset directories (/img, /css, /js, /fonts) and root-level
 *    static files (manifest, favicon, service-worker) so the migration page and
 *    browser shell can still load their required assets.
 *
 * For the official dramova.app domain (and any other hostname) the proxy
 * delegates to updateSession() with no behavioural change.
 */

const LEGACY_HOSTNAME = "dramova.vercel.app";
const MIGRATION_PAGE = "/domain-moved";

const STATIC_PREFIXES = ["/img", "/css", "/js", "/fonts"];
const STATIC_FILES = new Set([
  "/manifest.webmanifest",
  "/favicon.ico",
  "/favicon.png",
  "/sw.js",
]);

function isStaticAssetPath(pathname: string): boolean {
  if (STATIC_FILES.has(pathname)) return true;
  return STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix + "/"));
}

export async function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  const { pathname } = request.nextUrl;

  // ── Legacy domain migration rewrite ────────────────────────────────────────
  if (hostname === LEGACY_HOSTNAME) {
    if (pathname !== MIGRATION_PAGE && !isStaticAssetPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = MIGRATION_PAGE;
      return NextResponse.rewrite(url);
    }
  }

  // ── Existing Supabase session management ────────────────────────────────────
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
