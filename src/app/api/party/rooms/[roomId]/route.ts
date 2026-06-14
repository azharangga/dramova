import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRoomState, updateRoomSettings, closeRoom } from "@/lib/party";

// GET /api/party/rooms/[roomId] - Get room details with participants
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await getRoomState(supabase, roomId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ room: result.room, participants: result.participants });
}

// PATCH /api/party/rooms/[roomId] - Update room settings (host only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const result = await updateRoomSettings(supabase, user.id, roomId, body.settings || body);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/party/rooms/[roomId] - Close room (host only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await closeRoom(supabase, user.id, roomId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
