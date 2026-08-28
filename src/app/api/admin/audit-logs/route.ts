import { NextRequest, NextResponse } from "next/server";
import { getSuperuserApiSession } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const auth = await getSuperuserApiSession();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const actionFilter = searchParams.get("action") || "";

  const admin = createAdminClient();

  try {
    let query = admin
      .from("admin_audit_logs")
      .select("id, actor_id, action, entity_type, entity_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (actionFilter) {
      query = query.ilike("action", `%${actionFilter}%`);
    }

    const { data: logs, error } = await query;
    if (error) throw error;

    const actorIds = Array.from(new Set((logs || []).map((l) => l.actor_id)));
    let actorsMap: Record<string, { name: string; email: string }> = {};

    if (actorIds.length > 0) {
      const { data: actors } = await admin
        .from("profiles")
        .select("id, name, email")
        .in("id", actorIds);

      if (actors) {
        actors.forEach((a) => {
          actorsMap[a.id] = { name: a.name, email: a.email };
        });
      }
    }

    const enriched = (logs || []).map((l) => ({
      ...l,
      actor: actorsMap[l.actor_id] || { name: "Superuser", email: "" },
    }));

    return NextResponse.json({ logs: enriched });
  } catch (err: unknown) {
    console.error("[AdminAuditLogsAPI] Error:", err);
    return NextResponse.json({ error: "Gagal memuat audit logs" }, { status: 500 });
  }
}
