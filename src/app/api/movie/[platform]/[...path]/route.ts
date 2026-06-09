import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";
import { blockDirectNavigation } from "@/lib/request-guard";

const MOVIE_PLATFORMS = new Set(["kmovie", "cmovie", "jmovie", "thaimovie"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string; path: string[] }> }
) {
  const blocked = blockDirectNavigation(request);
  if (blocked) return blocked;
  const { platform, path } = await params;
  if (!MOVIE_PLATFORMS.has(platform)) {
    return Response.json({ status: false, message: "Movie platform tidak dikenal" }, { status: 404 });
  }
  return proxyToBackend(request, `/movie/${platform}/${path.join("/")}`);
}
