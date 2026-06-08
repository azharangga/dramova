import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const type = String(body.type || "").trim().slice(0, 80);
  if (!type) return NextResponse.json({ error: "Missing type" }, { status: 400 });

  await supabase.from("user_activity").insert({
    user_id: user.id,
    activity_type: type,
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
  });

  return NextResponse.json({ ok: true });
}
