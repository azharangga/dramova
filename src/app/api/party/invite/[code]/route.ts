import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveInviteCode } from "@/lib/party";

// GET /api/party/invite/[code] - Validate invite code
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await resolveInviteCode(supabase, code);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Fetch room basic info
  const { data: room } = await supabase
    .from("watch_rooms")
    .select("id, title, content_title, content_type, platform, current_episode, is_active, max_participants")
    .eq("id", result.roomId)
    .single();

  if (!room || !room.is_active) {
    return NextResponse.json({ error: "Room sudah ditutup" }, { status: 404 });
  }

  // Count current participants
  const { count } = await supabase
    .from("watch_room_participants")
    .select("*", { count: "exact", head: true })
    .eq("room_id", result.roomId);

  return NextResponse.json({
    room_id: result.roomId,
    room: { ...room, participant_count: count || 0 },
  });
}
