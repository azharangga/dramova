import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const contentType = String(body.contentType || "series").slice(0, 32);
  const platform = String(body.platform || "").slice(0, 64);
  const contentId = String(body.contentId || "").slice(0, 256);
  const episode = Number.isFinite(Number(body.episode)) ? Number(body.episode) : 1;
  const currentTime = Math.max(0, Math.floor(Number(body.currentTime || 0)));
  const duration = Math.max(0, Math.floor(Number(body.duration || 0)));
  const completed = Boolean(body.completed);

  if (!platform || !contentId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await supabase.from("watch_history").upsert(
    {
      user_id: user.id,
      content_type: contentType,
      platform,
      content_id: contentId,
      episode,
      title: body.title ? String(body.title).slice(0, 300) : null,
      cover_url: body.cover ? String(body.cover).slice(0, 1000) : null,
      position_seconds: currentTime,
      duration_seconds: duration,
      completed,
      last_watched_at: new Date().toISOString(),
    },
    { onConflict: "user_id,content_type,platform,content_id" },
  );

  if (completed) {
    await supabase.from("user_activity").insert({
      user_id: user.id,
      activity_type: "video_completed",
      metadata: { contentType, platform, contentId, episode, currentTime, duration },
    });
  }

  return NextResponse.json({ ok: true });
}
