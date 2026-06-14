import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRoom, listUserRooms, type CreateRoomPayload, type ContentType } from "@/lib/party";

// GET /api/party/rooms - List user's active rooms
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rooms = await listUserRooms(supabase, user.id);
  return NextResponse.json({ rooms, user_id: user.id });
}

// POST /api/party/rooms - Create a new room
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  // Validate required fields
  const title = String(body.title || "").trim();
  const content_type = String(body.content_type || "").trim() as ContentType;
  const platform = String(body.platform || "").trim();
  const content_id = String(body.content_id || "").trim();
  const content_title = String(body.content_title || "").trim();

  if (!title) return NextResponse.json({ error: "Judul room wajib diisi" }, { status: 400 });
  if (!["series", "movie"].includes(content_type)) {
    return NextResponse.json({ error: "Tipe konten tidak valid. Hanya series dan movie yang didukung." }, { status: 400 });
  }
  if (!platform) return NextResponse.json({ error: "Platform wajib diisi" }, { status: 400 });
  if (!content_id) return NextResponse.json({ error: "ID konten wajib diisi" }, { status: 400 });

  const payload: CreateRoomPayload = {
    title,
    content_type,
    platform,
    content_id,
    content_title,
    current_episode: body.current_episode ? parseInt(body.current_episode, 10) : 1,
    max_participants: Math.min(body.max_participants ? parseInt(body.max_participants, 10) : 5, 5),
    is_private: false,
    settings: body.settings,
    expires_in_hours: body.expires_in_hours === -1 || body.expires_in_hours === null
      ? -1
      : body.expires_in_hours
        ? parseFloat(body.expires_in_hours)
        : 24,
  };

  const userData = {
    name: user.user_metadata?.name || user.email?.split("@")[0] || "Pengguna",
    avatar_url: user.user_metadata?.avatar_url || null,
  };

  const result = await createRoom(supabase, user.id, userData, payload);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ room: result.room }, { status: 201 });
}
