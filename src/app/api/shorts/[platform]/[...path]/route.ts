import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

const SHORTS_PLATFORMS = new Set(["goodshort", "dramanova", "dramabite", "dramabox"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string; path: string[] }> }
) {
  const { platform, path } = await params;
  if (!SHORTS_PLATFORMS.has(platform)) {
    return Response.json({ status: false, message: "Shorts platform tidak dikenal" }, { status: 404 });
  }
  return proxyToBackend(request, `/shorts/${platform}/${path.join("/")}`);
}
