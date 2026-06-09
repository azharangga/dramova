import { NextRequest, NextResponse } from "next/server";

export function blockDirectNavigation(request: NextRequest) {
  const mode = request.headers.get("sec-fetch-mode");
  const dest = request.headers.get("sec-fetch-dest");
  if (mode === "navigate" || dest === "document") {
    return NextResponse.json({ error: "API endpoint tidak bisa dibuka langsung" }, { status: 403 });
  }
  return null;
}
