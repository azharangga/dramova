import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { mapAuthUser, type AuthUser } from "@/lib/auth-user";

export interface SuperuserSession {
  user: AuthUser;
  userId: string;
  isSuperuser: boolean;
}

/**
 * Server-side guard for Server Components (/dashboard/*).
 * Redirects to / if user is not a superuser or is banned.
 * Redirects to /login if user is not authenticated.
 */
export async function requireSuperuser(): Promise<SuperuserSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  // Use admin client to reliably check role without RLS interference
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("name, email, avatar_url, role, is_banned, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  const isSuperuser = profile?.role === "superuser" && !profile?.is_banned;

  if (!isSuperuser) {
    redirect("/");
  }

  return {
    user: mapAuthUser(user, profile)!,
    userId: user.id,
    isSuperuser: true,
  };
}

/**
 * Server-side verification for Route Handlers (/api/admin/*).
 * Returns session if superuser, or null + response if unauthorized.
 */
export async function getSuperuserApiSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", status: 401 as const, session: null };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("name, email, avatar_url, role, is_banned, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "superuser" || profile?.is_banned) {
    return { error: "Forbidden: Superuser access required", status: 403 as const, session: null };
  }

  return {
    error: null,
    status: 200 as const,
    session: {
      user: mapAuthUser(user, profile)!,
      userId: user.id,
      isSuperuser: true,
    },
  };
}

/**
 * Record an action to the admin_audit_logs table.
 * Uses service role client to guarantee log persistence.
 */
export async function recordAdminAuditLog({
  actorId,
  action,
  entityType,
  entityId,
  metadata = {},
}: {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("admin_audit_logs").insert({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      metadata: metadata || {},
    });
  } catch (err) {
    console.error("[AdminAuditLog] Failed to record log:", err);
  }
}
