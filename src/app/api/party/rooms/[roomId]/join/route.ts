import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { joinRoom } from "@/lib/party";

// POST /api/party/rooms/[roomId]/join - Join room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  const userData = {
    name: user.user_metadata?.name || user.email?.split("@")[0] || "Pengguna",
    avatar_url: user.user_metadata?.avatar_url || null,
  };

  const result = await joinRoom(supabase, user.id, userData, roomId, body.invite_code);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    participant: result.participant,
    room: result.room,
  });
}
