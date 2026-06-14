import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { leaveRoom } from "@/lib/party";

// POST /api/party/rooms/[roomId]/leave - Leave room
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await leaveRoom(supabase, user.id, roomId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
