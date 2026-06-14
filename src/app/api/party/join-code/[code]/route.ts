import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveInviteCode, resolveRoomCode } from "@/lib/party";

// GET /api/party/join-code/[code] - Resolve any 6-char code to room ID
// Tries invite code first, then room code as fallback.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Try invite code first
  let roomId: string | null = null;
  let lastError = "Kode tidak ditemukan";

  const inviteResult = await resolveInviteCode(supabase, code);
  if (inviteResult.roomId) {
    roomId = inviteResult.roomId;
  } else {
    // Fallback: try room code
    const roomResult = await resolveRoomCode(supabase, code);
    if (roomResult.roomId) {
      roomId = roomResult.roomId;
    } else {
      lastError = inviteResult.error || roomResult.error || "Kode tidak valid";
    }
  }

  if (!roomId) {
    return NextResponse.json({ error: lastError }, { status: 404 });
  }

  // Fetch room info
  const { data: room } = await supabase
    .from("watch_rooms")
    .select("id, title, content_title, content_type, platform, current_episode, code, max_participants")
    .eq("id", roomId)
    .single();

  if (!room) {
    return NextResponse.json({ error: "Room tidak ditemukan" }, { status: 404 });
  }

  // Count participants
  const { count } = await supabase
    .from("watch_room_participants")
    .select("*", { count: "exact", head: true })
    .eq("room_id", roomId);

  return NextResponse.json({
    room_id: roomId,
    room: { ...room, participant_count: count || 0 },
  });
}
