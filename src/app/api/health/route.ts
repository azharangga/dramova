import { NextResponse } from "next/server";

export async function GET() {
  const start = Date.now();
  const backendUrl = process.env.API_BASE_URL || "http://localhost:7860";
  
  try {
    const res = await fetch(backendUrl, {
      method: "GET",
      cache: "no-store",
      headers: { "User-Agent": "Dramova-KeepAlive/1.0" }
    });
    
    return NextResponse.json({
      status: "success",
      backend: res.ok ? "online" : "error",
      backend_status: res.status,
      latency_ms: Date.now() - start
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      backend: "offline",
      error: String(error),
      latency_ms: Date.now() - start
    }, { status: 502 });
  }
}
