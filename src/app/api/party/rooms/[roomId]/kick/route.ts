import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { kickParticipant } from "@/lib/party";

// POST /api/party/rooms/[roomId]/kick - Kick participant (host/mod only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const targetUserId = String(body.target_user_id || "").trim();

  if (!targetUserId) {
    return NextResponse.json({ error: "ID target pengguna wajib diisi" }, { status: 400 });
  }

  const result = await kickParticipant(supabase, user.id, roomId, targetUserId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
