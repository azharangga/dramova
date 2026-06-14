import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createInvite } from "@/lib/party";

// POST /api/party/invite - Create invite link/code (host only)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const roomId = String(body.room_id || "").trim();

  if (!roomId) {
    return NextResponse.json({ error: "Room ID wajib diisi" }, { status: 400 });
  }

  const maxUses = body.max_uses ? parseInt(body.max_uses, 10) : 0;
  // Default: 5-minute expiry
  const expiresInMinutes = body.expires_in_minutes ? parseInt(body.expires_in_minutes, 10) : 5;

  const result = await createInvite(supabase, user.id, roomId, maxUses, expiresInMinutes);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  const inviteUrl = `${request.nextUrl.origin}/party/join/${result.code}`;

  return NextResponse.json({
    code: result.code,
    invite_url: inviteUrl,
  });
}
