import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Domain migration rewrite layer.
 * 
 * Delegates to updateSession() with no behavioural change.
 */

export async function proxy(request: NextRequest) {
  // ── Existing Supabase session management ────────────────────────────────────
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
