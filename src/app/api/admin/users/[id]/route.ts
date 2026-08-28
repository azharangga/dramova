import { NextRequest, NextResponse } from "next/server";
import { getSuperuserApiSession } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getSuperuserApiSession();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: "User ID missing" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    // 1. Profile
    const { data: profile, error: pError } = await admin
      .from("profiles")
      .select("id, name, email, avatar_url, role, is_banned, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (pError || !profile) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    // 2. Watch History
    const { data: watchHistory } = await admin
      .from("watch_history")
      .select("id, content_type, platform, content_id, episode, title, cover_url, position_seconds, duration_seconds, completed, last_watched_at")
      .eq("user_id", userId)
      .order("last_watched_at", { ascending: false })
      .limit(30);

    // 3. User Activity Logs
    const { data: activities } = await admin
      .from("user_activity")
      .select("id, activity_type, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    // 4. Hosted Watch Rooms
    const { data: hostedRooms } = await admin
      .from("watch_rooms")
      .select("id, code, title, content_type, platform, content_title, is_active, created_at, expires_at")
      .eq("host_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      profile,
      watchHistory: watchHistory || [],
      activities: activities || [],
      hostedRooms: hostedRooms || [],
    });
  } catch (err: unknown) {
    console.error("[AdminUserDetailAPI] Error:", err);
    return NextResponse.json({ error: "Gagal mengambil data detail user" }, { status: 500 });
  }
}
