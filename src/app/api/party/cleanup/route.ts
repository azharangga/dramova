import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanupExpiredRooms } from "@/lib/party";

/**
 * POST /api/party/cleanup
 * Cron job endpoint: deactivate expired rooms and remove their participants.
 * Secured with CRON_SECRET env var.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret (Vercel sends it as Authorization header or query param)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const result = await cleanupExpiredRooms(supabase);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, cleaned: result.cleaned });
  } catch (err) {
    console.error("[Cron] Party cleanup failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
