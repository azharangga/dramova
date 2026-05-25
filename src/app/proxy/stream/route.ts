import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/proxy/stream", { stream: true });
}

export async function HEAD(request: NextRequest) {
  return proxyToBackend(request, "/proxy/stream", { stream: true });
}

export async function OPTIONS(request: NextRequest) {
  return proxyToBackend(request, "/proxy/stream", { stream: true });
}
