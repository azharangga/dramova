import { NextRequest, NextResponse } from "next/server";
import { getSuperuserApiSession, recordAdminAuditLog } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// 1. GET: Fetch users with search and filter
export async function GET(req: NextRequest) {
  try {
    const authResult = await getSuperuserApiSession();
    if (authResult.error || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const adminClient = createAdminClient();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    let dbQuery = adminClient
      .from("profiles")
      .select("id, name, email, avatar_url, role, is_banned, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,id.ilike.%${query}%`);
    }

    if (role && role !== "all") {
      dbQuery = dbQuery.eq("role", role);
    }

    if (status && status !== "all") {
      if (status === "banned") {
        dbQuery = dbQuery.eq("is_banned", true);
      } else if (status === "active") {
        dbQuery = dbQuery.eq("is_banned", false);
      }
    }

    const { data: users, error } = await dbQuery;
    if (error) throw error;

    // Fetch counts in parallel
    const usersWithStats = await Promise.all(
      (users || []).map(async (u: any) => {
        const [{ count: watchCount }, { count: roomCount }] = await Promise.all([
          adminClient.from("watch_history").select("*", { count: "exact", head: true }).eq("user_id", u.id),
          adminClient.from("watch_rooms").select("*", { count: "exact", head: true }).eq("host_id", u.id),
        ]);

        return {
          ...u,
          watchCount: watchCount || 0,
          roomCount: roomCount || 0,
        };
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: error.status || 401 });
  }
}

// 2. POST: Create New User
export async function POST(req: NextRequest) {
  try {
    const authResult = await getSuperuserApiSession();
    if (authResult.error || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const currentSuperuser = authResult.session.user;
    const body = await req.json();
    const { email, password, name, role = "user" } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, dan nama wajib diisi" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Create user in auth.users
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) throw authError;

    // Update profiles table
    if (authUser.user) {
      await adminClient.from("profiles").upsert({
        id: authUser.user.id,
        name,
        email,
        role: role === "superuser" ? "superuser" : "user",
        is_banned: false,
        updated_at: new Date().toISOString(),
      });

      // Record Audit Log
      await recordAdminAuditLog({
        actorId: currentSuperuser.id,
        action: "create_user",
        entityType: "user",
        entityId: authUser.user.id,
        metadata: { email, name, role },
      });
    }

    return NextResponse.json({ message: "Pengguna berhasil dibuat", user: authUser.user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal membuat pengguna" }, { status: 400 });
  }
}

// 3. PATCH: Update user info / role / ban status
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await getSuperuserApiSession();
    if (authResult.error || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const currentSuperuser = authResult.session.user;
    const body = await req.json();
    const { targetUserId, role, isBanned, name, email, reason } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    if (targetUserId === currentSuperuser.id && (isBanned === true || role === "user")) {
      return NextResponse.json({ error: "Anda tidak dapat memblokir atau menurunkan peran akun Anda sendiri" }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof role === "string") updates.role = role;
    if (typeof isBanned === "boolean") updates.is_banned = isBanned;
    if (typeof name === "string" && name.trim()) updates.name = name.trim();

    const adminClient = createAdminClient();

    const { error: profileError } = await adminClient
      .from("profiles")
      .update(updates)
      .eq("id", targetUserId);

    if (profileError) throw profileError;

    // Record audit log
    await recordAdminAuditLog({
      actorId: currentSuperuser.id,
      action: isBanned !== undefined ? (isBanned ? "ban_user" : "unban_user") : role ? "update_role" : "edit_user",
      entityType: "user",
      entityId: targetUserId,
      metadata: { ...updates, reason },
    });

    return NextResponse.json({ message: "Data pengguna berhasil diperbarui" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan" }, { status: 400 });
  }
}

// 4. DELETE: Delete user permanently
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await getSuperuserApiSession();
    if (authResult.error || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const currentSuperuser = authResult.session.user;
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("id");

    if (!targetUserId) {
      return NextResponse.json({ error: "ID pengguna wajib disertakan" }, { status: 400 });
    }

    if (targetUserId === currentSuperuser.id) {
      return NextResponse.json({ error: "Anda tidak dapat menghapus akun Anda sendiri" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Delete associated data in public tables
    await Promise.all([
      adminClient.from("watch_history").delete().eq("user_id", targetUserId),
      adminClient.from("watch_rooms").delete().eq("host_id", targetUserId),
      adminClient.from("profiles").delete().eq("id", targetUserId),
    ]);

    // 2. Delete user in auth.users
    const { error: authError } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (authError) throw authError;

    // 3. Log Audit
    await recordAdminAuditLog({
      actorId: currentSuperuser.id,
      action: "delete_user",
      entityType: "user",
      entityId: targetUserId,
      metadata: { deleted_at: new Date().toISOString() },
    });

    return NextResponse.json({ message: "Pengguna berhasil dihapus secara permanen" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menghapus pengguna" }, { status: 400 });
  }
}
