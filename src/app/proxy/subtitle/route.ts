import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";
import { readMediaToken } from "@/lib/secure-media";

export async function GET(request: NextRequest) {
  if (!readMediaToken(request.nextUrl.searchParams.get("token") || "", "subtitle")) {
    return Response.json({ error: "Invalid media token" }, { status: 403 });
  }
  return proxyToBackend(request, "/proxy/subtitle", { stream: true });
}

export async function OPTIONS(request: NextRequest) {
  return proxyToBackend(request, "/proxy/subtitle", { stream: true });
}
