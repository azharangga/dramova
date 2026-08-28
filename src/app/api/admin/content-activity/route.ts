import { NextRequest, NextResponse } from "next/server";
import { getSuperuserApiSession } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/content-activity - Aggregate watch history insights
export async function GET(request: NextRequest) {
  const auth = await getSuperuserApiSession();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const platformFilter = searchParams.get("platform") || "";
  const typeFilter = searchParams.get("type") || "";
  const search = (searchParams.get("q") || "").toLowerCase().trim();

  const admin = createAdminClient();

  try {
    let query = admin
      .from("watch_history")
      .select("id, user_id, content_type, platform, content_id, episode, title, cover_url, position_seconds, duration_seconds, completed, last_watched_at")
      .order("last_watched_at", { ascending: false });

    if (platformFilter) {
      query = query.eq("platform", platformFilter);
    }
    if (typeFilter && ["series", "movie", "shorts"].includes(typeFilter)) {
      query = query.eq("content_type", typeFilter);
    }

    const { data: records, error } = await query;
    if (error) throw error;

    let filtered = records || [];
    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.title?.toLowerCase().includes(search) ||
          r.platform?.toLowerCase().includes(search) ||
          r.content_id?.toLowerCase().includes(search)
      );
    }

    // Top watched titles aggregation
    const titleCounts: Record<
      string,
      {
        title: string;
        platform: string;
        contentType: string;
        coverUrl: string | null;
        totalViews: number;
        completedCount: number;
        lastWatched: string;
      }
    > = {};

    filtered.forEach((r) => {
      const key = `${r.platform}:${r.content_id}`;
      if (!titleCounts[key]) {
        titleCounts[key] = {
          title: r.title || r.content_id,
          platform: r.platform,
          contentType: r.content_type,
          coverUrl: r.cover_url,
          totalViews: 0,
          completedCount: 0,
          lastWatched: r.last_watched_at,
        };
      }
      titleCounts[key].totalViews += 1;
      if (r.completed) titleCounts[key].completedCount += 1;
      if (
        new Date(r.last_watched_at).getTime() >
        new Date(titleCounts[key].lastWatched).getTime()
      ) {
        titleCounts[key].lastWatched = r.last_watched_at;
      }
    });

    const topContent = Object.values(titleCounts)
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 20);

    return NextResponse.json({
      records: filtered.slice(0, 100),
      topContent,
      totalCount: filtered.length,
    });
  } catch (err: unknown) {
    console.error("[AdminContentActivityAPI] Error:", err);
    return NextResponse.json({ error: "Gagal memuat aktivitas tontonan" }, { status: 500 });
  }
}
