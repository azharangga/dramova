import { NextResponse } from "next/server";
import { getSuperuserApiSession } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await getSuperuserApiSession();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();

  try {
    // 1. Total & banned users
    const { data: profiles, error: pError } = await admin
      .from("profiles")
      .select("id, role, is_banned, created_at");

    if (pError) throw pError;

    const totalUsers = profiles?.length || 0;
    const superusersCount = profiles?.filter((p) => p.role === "superuser").length || 0;
    const bannedUsersCount = profiles?.filter((p) => p.is_banned).length || 0;

    // 2. Watch rooms stats
    const { data: rooms, error: rError } = await admin
      .from("watch_rooms")
      .select("id, code, is_active, content_type, platform, created_at, expires_at");

    if (rError) throw rError;

    const totalRooms = rooms?.length || 0;
    const activeRooms = rooms?.filter((r) => r.is_active).length || 0;

    // 3. Watch history stats
    const { data: watchHistory, error: wError } = await admin
      .from("watch_history")
      .select("id, content_type, platform, completed, last_watched_at");

    if (wError) throw wError;

    const totalWatchEntries = watchHistory?.length || 0;
    const completedWatches = watchHistory?.filter((w) => w.completed).length || 0;

    // Content type distribution from watch history
    const contentBreakdown: Record<string, number> = {
      series: 0,
      movie: 0,
      shorts: 0,
    };
    const platformBreakdown: Record<string, number> = {};

    watchHistory?.forEach((w) => {
      if (w.content_type && contentBreakdown[w.content_type] !== undefined) {
        contentBreakdown[w.content_type] = (contentBreakdown[w.content_type] || 0) + 1;
      }
      if (w.platform) {
        platformBreakdown[w.platform] = (platformBreakdown[w.platform] || 0) + 1;
      }
    });

    // 4. User activity count (last 24h & total)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentActivity, error: aError } = await admin
      .from("user_activity")
      .select("id, activity_type, user_id, created_at")
      .gte("created_at", oneDayAgo);

    if (aError) throw aError;

    const activity24h = recentActivity?.length || 0;

    // 5. Recent registered users (last 5)
    const { data: latestUsers } = await admin
      .from("profiles")
      .select("id, name, email, avatar_url, role, is_banned, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    // 6. Recent active watch rooms (last 5)
    const { data: latestRooms } = await admin
      .from("watch_rooms")
      .select("id, code, title, content_type, platform, content_title, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    // 7. Recent activities (last 10)
    const { data: latestActivities } = await admin
      .from("user_activity")
      .select("id, user_id, activity_type, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      metrics: {
        totalUsers,
        superusersCount,
        bannedUsersCount,
        totalRooms,
        activeRooms,
        totalWatchEntries,
        completedWatches,
        activity24h,
      },
      contentBreakdown,
      platformBreakdown,
      latestUsers: latestUsers || [],
      latestRooms: latestRooms || [],
      latestActivities: latestActivities || [],
    });
  } catch (err: unknown) {
    console.error("[AdminStatsAPI] Error:", err);
    return NextResponse.json(
      { error: "Gagal memuat statistik Superuser" },
      { status: 500 }
    );
  }
}
