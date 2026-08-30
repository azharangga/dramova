/**
 * Adaptive Multi-Domain & Base URL Resolver
 * Supports custom domains (e.g. dramova.app), Vercel deployments (dramova.vercel.app),
 * environment variables, and fallback.
 */

export function getBaseUrl(): string {
  // 1. Explicitly configured custom domain in environment variable
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const url = process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/+$/, "");
    return url.startsWith("http") ? url : `https://${url}`;
  }

  // 2. Vercel Production URL or Deployment URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/, "")}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}`;
  }

  // 3. Default fallback production domain (supports dramova.app or dramova.vercel.app)
  if (process.env.NODE_ENV === "production") {
    return "https://dramova.vercel.app";
  }

  // 4. Local development
  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const base = getBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
