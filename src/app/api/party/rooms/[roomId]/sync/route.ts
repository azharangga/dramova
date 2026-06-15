import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRoomState } from "@/lib/party";

// GET /api/party/rooms/[roomId]/sync - Get current playback state (for late joiners)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await getRoomState(supabase, roomId);

  if (result.error || !result.room) {
    return NextResponse.json({ error: result.error || "Room tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({
    playback_state: result.room.playback_state,
    current_episode: result.room.current_episode,
    settings: result.room.settings,
    server_time: new Date().toISOString(),
  });
}

// POST /api/party/rooms/[roomId]/sync - Heartbeat: update last_heartbeat_at for active participant
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Update heartbeat timestamp for this participant
  const { error } = await supabase
    .from("watch_room_participants")
    .update({ last_heartbeat_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
