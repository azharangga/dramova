import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToBackend(request, `/proxy/${path.join("/")}`, { stream: true });
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToBackend(request, `/proxy/${path.join("/")}`, { stream: true });
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToBackend(request, `/proxy/${path.join("/")}`, { stream: true });
}
