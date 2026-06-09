import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";
import { blockDirectNavigation } from "@/lib/request-guard";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const blocked = blockDirectNavigation(request);
  if (blocked) return blocked;
  const { path } = await params;
  if (request.nextUrl.searchParams.has("url")) {
    return Response.json({ error: "Direct media URL is not allowed" }, { status: 403 });
  }
  return proxyToBackend(request, `/proxy/${path.join("/")}`, { stream: true });
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const blocked = blockDirectNavigation(request);
  if (blocked) return blocked;
  const { path } = await params;
  if (request.nextUrl.searchParams.has("url")) {
    return Response.json({ error: "Direct media URL is not allowed" }, { status: 403 });
  }
  return proxyToBackend(request, `/proxy/${path.join("/")}`, { stream: true });
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (request.nextUrl.searchParams.has("url")) {
    return Response.json({ error: "Direct media URL is not allowed" }, { status: 403 });
  }
  return proxyToBackend(request, `/proxy/${path.join("/")}`, { stream: true });
}
