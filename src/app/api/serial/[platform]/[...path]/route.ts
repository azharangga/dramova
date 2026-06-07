import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

const SERIAL_PLATFORMS = new Set([
  "kdrama",
  "cdrama",
  "varietyshow",
  "jdrama",
  "thaidrama",
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string; path: string[] }> }
) {
  const { platform, path } = await params;
  if (!SERIAL_PLATFORMS.has(platform)) {
    return Response.json({ status: false, message: "Serial platform tidak dikenal" }, { status: 404 });
  }
  return proxyToBackend(request, `/serial/${platform}/${path.join("/")}`);
}
