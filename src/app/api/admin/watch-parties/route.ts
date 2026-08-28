import { NextRequest, NextResponse } from "next/server";
import { getSuperuserApiSession, recordAdminAuditLog } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/watch-parties - List all watch rooms with participants
export async function GET(request: NextRequest) {
  const auth = await getSuperuserApiSession();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("q") || "").toLowerCase().trim();
  const statusFilter = searchParams.get("status") || "";
  const typeFilter = searchParams.get("type") || "";

  const admin = createAdminClient();

  try {
    let query = admin
      .from("watch_rooms")
      .select("id, code, host_id, title, content_type, platform, content_id, content_title, current_episode, playback_state, max_participants, is_private, is_active, settings, created_at, updated_at, expires_at")
      .order("created_at", { ascending: false });

    if (statusFilter === "active") {
      query = query.eq("is_active", true);
    } else if (statusFilter === "inactive") {
      query = query.eq("is_active", false);
    }

    if (typeFilter && ["series", "movie", "shorts"].includes(typeFilter)) {
      query = query.eq("content_type", typeFilter);
    }

    const { data: rooms, error } = await query;
    if (error) throw error;

    let filteredRooms = rooms || [];
    if (search) {
      filteredRooms = filteredRooms.filter(
        (r) =>
          r.title?.toLowerCase().includes(search) ||
          r.content_title?.toLowerCase().includes(search) ||
          r.code?.toLowerCase().includes(search) ||
          r.platform?.toLowerCase().includes(search)
      );
    }

    const roomIds = filteredRooms.map((r) => r.id);
    const hostIds = Array.from(new Set(filteredRooms.map((r) => r.host_id)));

    // Fetch hosts profiles & participant counts
    let hostsMap: Record<string, { name: string; email: string; avatar_url: string | null }> = {};
    let participantsMap: Record<string, number> = {};

    if (hostIds.length > 0) {
      const { data: hosts } = await admin
        .from("profiles")
        .select("id, name, email, avatar_url")
        .in("id", hostIds);

      if (hosts) {
        hosts.forEach((h) => {
          hostsMap[h.id] = { name: h.name, email: h.email, avatar_url: h.avatar_url };
        });
      }
    }

    if (roomIds.length > 0) {
      const { data: participants } = await admin
        .from("watch_room_participants")
        .select("room_id, id, status");

      if (participants) {
        participants.forEach((p) => {
          participantsMap[p.room_id] = (participantsMap[p.room_id] || 0) + 1;
        });
      }
    }

    const enriched = filteredRooms.map((r) => ({
      ...r,
      host: hostsMap[r.host_id] || { name: "Pengguna", email: "", avatar_url: null },
      participantCount: participantsMap[r.id] || 0,
    }));

    return NextResponse.json({ rooms: enriched });
  } catch (err: unknown) {
    console.error("[AdminWatchPartiesAPI] Error:", err);
    return NextResponse.json({ error: "Gagal memuat data Watch Party" }, { status: 500 });
  }
}

// PATCH /api/admin/watch-parties - Deactivate/Close room or trigger cleanup
export async function PATCH(request: NextRequest) {
  const auth = await getSuperuserApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status });
  }

  const admin = createAdminClient();
  const body = await request.json().catch(() => ({}));
  const { roomId, action } = body;

  try {
    if (action === "cleanup") {
      // Trigger expired room cleanup
      const { data: deactivated, error } = await admin.rpc("cleanup_expired_rooms");
      if (error) {
        // Fallback manual cleanup if RPC function not configured
        const nowIso = new Date().toISOString();
        const { data: manualUpdate } = await admin
          .from("watch_rooms")
          .update({ is_active: false })
          .eq("is_active", true)
          .lt("expires_at", nowIso)
          .select("id");

        await recordAdminAuditLog({
          actorId: auth.session.userId,
          action: "cleanup_expired_rooms",
          entityType: "watch_rooms",
          metadata: { affectedRooms: manualUpdate?.length || 0 },
        });

        return NextResponse.json({
          success: true,
          message: `Berhasil membersihkan ${manualUpdate?.length || 0} room kedaluwarsa.`,
        });
      }

      await recordAdminAuditLog({
        actorId: auth.session.userId,
        action: "cleanup_expired_rooms",
        entityType: "watch_rooms",
        metadata: { affectedRooms: deactivated || 0 },
      });

      return NextResponse.json({
        success: true,
        message: `Berhasil membersihkan ${deactivated || 0} room kedaluwarsa.`,
      });
    }

    if (!roomId) {
      return NextResponse.json({ error: "Room ID wajib disertakan" }, { status: 400 });
    }

    if (action === "deactivate") {
      const { data: updated, error } = await admin
        .from("watch_rooms")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", roomId)
        .select("id, title, code, is_active")
        .single();

      if (error) throw error;

      // Delete active participants for the closed room
      await admin.from("watch_room_participants").delete().eq("room_id", roomId);

      await recordAdminAuditLog({
        actorId: auth.session.userId,
        action: "deactivate_room",
        entityType: "watch_room",
        entityId: roomId,
        metadata: { roomTitle: updated.title, roomCode: updated.code },
      });

      return NextResponse.json({ room: updated, success: true });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (err: unknown) {
    console.error("[AdminWatchPartiesPatchAPI] Error:", err);
    return NextResponse.json({ error: "Gagal memproses aksi room" }, { status: 500 });
  }
}
